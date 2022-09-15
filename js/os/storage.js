const StorageVersion = 1;
const DbName = "WalkerFS";
const FilesStore = "Files";
const CollectionsStore = "Collections"
const RootCollectionName = "root";
class Storage {
    constructor(errorHandler) {
        this.db = null;
        this.openRequest = null;
        this.errorHandler = errorHandler;
        this.onbooted = null;
        this.currentCollection = null;
        this.rootCollection = null;
    }
    boot() {
        this.openRequest = window.indexedDB.open(DbName, StorageVersion);
        this.openRequest.onupgradeneeded = this.initializeSchema.bind(this);
        this.openRequest.onerror = this.handleError.bind(this);
        this.openRequest.onsuccess = async function (event) { await this.postInitialize(event) }.bind(this);
    }
    completeBoot() {
        if (this.onbooted) {
            this.onbooted();
        }
    }
    initializeSchema(event) {
        let db = event.target.result;
        db.onerror = this.handleError.bind(this);
        switch (event.oldVersion) {
            case 0: this.createDatabase(db);
        }
    }
    createDatabase(db) {
        let filesStore = db.createObjectStore(FilesStore, { keyPath: "id", autoIncrement: true });
        let collectionsStore = db.createObjectStore(CollectionsStore, { keyPath: "id", autoIncrement: true });
        filesStore.createIndex(`${FilesStore}_name_index`, "name");
        collectionsStore.createIndex(`${CollectionsStore}_name_index`, "name");
    }
    handleError(event) {
        this.errorHandler.error(event.currentTarget.error);
        console.error(event);
    }
    async postInitialize(event) {
        console.debug("Storage.postInitialize");
        this.db = this.openRequest.result;
        let transaction = this.getTransaction("readwrite");
        transaction.onerror = this.handleError.bind(this);
        let collectionsStore = transaction.objectStore(CollectionsStore);
        let collectionNameIndex = collectionsStore.index(`${CollectionsStore}_name_index`);
        let rootCollectionRequest = collectionNameIndex.getAll(RootCollectionName);
        rootCollectionRequest.onerror = this.handleError.bind(this);
        rootCollectionRequest.onsuccess = async function(event) {
            if (rootCollectionRequest.result.length == 0) {
                let acl = new Acl();
                acl.users.push(User.masterAccount());
                await this.internalCreateCollection(RootCollectionName, collectionsStore, acl);
                this.rootCollection = await this.getCollection(RootCollectionName);
            }
        }.bind(this);
        this.rootCollection = await this.getCollection(RootCollectionName);
        console.debug(`rootCollection: ${this.rootCollection}`);
        this.completeBoot();
        console.debug("Storage.postInitialize finished");
    }
    getTransaction(mode) {
        return this.db.transaction([CollectionsStore, FilesStore], mode);
    }
    getCollectionNameIndex(transaction) {
        let collectionsStore = transaction.objectStore(CollectionsStore);
        return collectionsStore.index(`${CollectionsStore}_name_index`);
    }
    getFileNameIndex(transaction) {
        let fileStore = transaction.objectStore(FilesStore);
        return fileStore.index(`${FilesStore}_name_index`);
    }
    async internalCreateCollection(name, store, acl, parentCollectionId) {
        let collection = new Collection(name, acl, parentCollectionId);
        let request = store.add(collection);
        await this.waitForRequest(request);
        console.debug('internalCreateCollection - request:', request);
    }
    async collectionExists(path) {
        let transaction = this.getTransaction("readonly");
        let index = this.getCollectionNameIndex(transaction);
        let segments = path.split('/');
        let root = await index.get(RootCollectionName)
        await this.waitForRequest(root);
        let parent = root.result;
        transaction = this.getTransaction("readonly");
        index = this.getCollectionNameIndex(transaction);
        while (segments.length > 0) {
            let segment = segments.shift();
            if (segment === "") {
                continue;
            }
            let candidates = await index.getAll(segment);
            await this.waitForRequest(candidates);
            console.debug(`candidates.readyState = ${candidates.readyState}`);
            let collection = candidates.result.find(c => c.parentCollectionId === parent.id);
            if (!collection) {
                return false;
            }
            parent = collection;
            transaction = this.getTransaction("readonly");
            index = this.getCollectionNameIndex(transaction);
        }
        return true;
    }
    async waitForRequest(request) {
        return new Promise((resolve) => {
            internalWaitForRequest();
            function internalWaitForRequest() {
                console.debug("Storage waiting for pending operation")
                if (request.readyState === "pending") {
                    setTimeout(internalWaitForRequest, 0, request);
                }
                else {
                    resolve();
                }
            }
        });
    }
    async getCollection(path) {
        let transaction = this.getTransaction("readonly");
        let index = this.getCollectionNameIndex(transaction);
        let root = await index.get(RootCollectionName);
        await this.waitForRequest(root);
        if (!path) {
            return root.result;
        }
        let segments = path.split('/');
        if (segments[0] === RootCollectionName) {
            segments.shift();
        }
        let parent = root.result;
        let collection = parent;
        while (segments.length > 0) {
            let segment = segments.shift();
            if (segment === "") {
                continue;
            }
            let transaction = this.getTransaction("readonly");
            let index = this.getCollectionNameIndex(transaction);
            let candidates = await index.getAll(segment);
            await this.waitForRequest(candidates);
            collection = candidates.result.find(c => c.parentCollectionId === parent.id);
            if (!collection) {
                this.errorHandler.error(`Collection '${segment}' not found in path '${path}'`);
            }
            parent = collection;
        }
        console.debug(`getCollection returns: ${collection}`);
        return collection;
    }
    async createCollection(name, acl, parentCollection) {
        let parent = parentCollection;
        if (!parent) {
            parent = this.rootCollection;
        }
        let transaction = this.getTransaction("readwrite");
        let collectionStore = transaction.objectStore(CollectionsStore);
        await this.internalCreateCollection(name, collectionStore, acl, parent.id);
    }
    deleteCollection(collection) {
        let transaction = this.getTransaction("readwrite");
        let collectionStore = transaction.objectStore(CollectionsStore);
        collectionStore.delete(collection.id);
    }
    async fileExists(path) {
        let collectionPath = path.substring(0, path.lastIndexOf('/'));
        let fileName = path.substring(path.lastIndexOf('/') + 1);
        if (!await this.collectionExists(collectionPath)) {
            return false;
        }
        let collection = await this.getCollection(collectionPath);
        let transaction = this.getTransaction("readonly");
        let index = this.getFileNameIndex(transaction);
        let candidates = await index.getAll(fileName);
        await this.waitForRequest(candidates);
        return candidates.result.some(f => f.collections.some(c => c === collection.id));
    }
    async getFile(path) {
        let collectionPath = path.substring(0, path.lastIndexOf('/'));
        let fileName = path.substring(path.lastIndexOf('/') + 1);
        if (!await this.collectionExists(collectionPath)) {
            this.errorHandler.error(`Path '${collectionPath}' not found`);
        }
        let collection = await this.getCollection(collectionPath);
        let transaction = this.getTransaction("readonly");
        let index = this.getFileNameIndex(transaction);
        let candidates = await index.getAll(fileName);
        await this.waitForRequest(candidates);
        let file = candidates.result.find(f => f.collections.some(c => c === collection.id));
        if (!file) {
            this.errorHandler.error(`File '${fileName}' not found in path '${collectionPath}'`)
        }
        return file;
    }
    async createFile(path, name) {
        if (!await this.collectionExists(path)) {
            this.errorHandler.error(`Path '${path}' not found`);
            return;
        }
        let collection = await this.getCollection(path);
        let transaction = this.getTransaction("readwrite");
        let index = this.getFileNameIndex(transaction);
        let candidates = await index.getAll(name);
        await this.waitForRequest(candidates);
        if (candidates.result.some(f => f.collections.some(c => c === collection.id))) {
            this.errorHandler.error(`File '${name}' already exists in path '${path}'`);
            return;
        }
        let file = new File(collection, name);
        transaction = this.getTransaction("readwrite");
        let fileStore = transaction.objectStore(FilesStore);
        fileStore.add(file);
    }
    async saveFile(file) {
        let transaction = this.getTransaction("readwrite");
        let fileStore = transaction.objectStore(FilesStore);
        fileStore.openCursor(file.id).onsuccess = function (event) {
            let cursor = event.target.result;
            let existingFile = cursor.value;
            File.update(existingFile, file);
            cursor.update(existingFile);
        };
    }
}

class Collection {
    constructor(name, acl, parentCollectionId) {
        //this.id = -1;
        this.name = name;
        this.acl = acl;
        this.childCollectionIds = [];
        this.parentCollectionId = parentCollectionId;
    }
}

class File {
    constructor(collection, name, acl) {
        //this.id = -1;
        this.collections = [];
        this.collections.push(collection.id);
        this.name = name;
        this.content = "";
        if (acl) {
            this.acl = acl;
            this.aclInherited = false;
        } else {
            this.inheritAcl(collection);
        }
    }
    inheritAcl(collection) {
        this.acl = collection.acl;
        this.aclInherited = true;
    }
    static update(existingFile, updatedFile) {
        existingFile.content = updatedFile.content;
    }
}

class Acl {
    constructor() {
        this.users = [];
        this.groups = [];
    }
}