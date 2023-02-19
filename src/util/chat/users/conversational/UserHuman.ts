import {User, UserTypes} from "src/util/chat/users/User";

export class UserHuman extends User {
    constructor(id: string) {
        super(id, "Human", UserTypes.HUMAN);
        this.showInMembersInfo = false;
        this.defaultJoin = true;
    }
}
