const MasterWalkerAccountId = "00000001-0001-0001-0001-000000000001";
const MasterWalkerAccountName = "mw";
class User {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.password = "";
    }
    static masterAccount() {
        return new User(MasterWalkerAccountId, MasterWalkerAccountName);
    }
}

class Group {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

class Security {
    constructor(os) {
        this.os = os;
    }
    async boot() {
        if (!await this.os.storage.collectionExists("/walker")) {
            await this.os.storage.createCollection("walker");
        }
        let walkerCollection = await this.os.storage.getCollection("/walker");
        if (!await this.os.storage.collectionExists("/walker/sys")) {
            await this.os.storage.createCollection("sys", null, walkerCollection);
        }
        if (!await this.os.storage.fileExists("/walker/sys/accounts")) {
            let masterAccount = User.masterAccount();
            this.os.writeOutput("No master account available. Creating master account");
            let password = await this.promptForNewPassword();
            masterAccount.password = password;
            await this.os.storage.createFile("/walker/sys", "accounts");
            let file = await this.os.storage.getFile("/walker/sys/accounts");
            file.content = JSON.stringify([ masterAccount ]);
            await this.os.storage.saveFile(file);
        }
    }
    async promptForNewPassword() {
        this.os.writeOutput("\r\nPassword: ");
        let password = await this.os.readInput('*');
        this.os.writeOutput("\r\nConfirm : ")
        let confirmedPassword = await this.os.readInput('*');
        if (password !== confirmedPassword) {
            this.os.writeOutput("\r\nPasswords not equal! Try again");
            return await this.promptForNewPassword();
        }
        return password;
    }
    async login() {
        let user = null;
        let password = '';
        do
        {
            let username = '';
            do
            {
                this.os.writeOutput("\r\nUsername: ");
                username = await this.os.readInput();
            } while (username == '');
            this.os.writeOutput("\r\nPassword: ");
            password = await this.os.readInput('*');
            let file = await this.os.storage.getFile("/walker/sys/accounts");
            let users = JSON.parse(file.content);
            user = users.find(u => u.name.toUpperCase() === username.toUpperCase());
        } while (!user || user.password !== password);
        return user;
    }
    encrypt(data) {
        return data;
    }
    decrypt(data) {
        return data;
    }
}