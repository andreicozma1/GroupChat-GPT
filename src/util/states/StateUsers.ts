import {UserDalleGen, UserGoogle} from "src/util/chat/users/UserHelpers";
import {UserCoordinator} from "src/util/chat/users/UserCoordinator";
import {User} from "src/util/chat/users/User";
import {UserDavinci} from "src/util/chat/users/conversational/UserDavinci";
import {UserDalle} from "src/util/chat/users/conversational/UserDalle";
import {UserCodex} from "src/util/chat/users/conversational/UserCodex";


export interface ChatStoreUserData {
    usersMap: Record<string, User>;
    myUserId: string;
}

const getDefault = (): ChatStoreUserData => {
    const defaultUsers = [
        new UserCoordinator(),
        new UserDavinci(),
        new UserDalle(), new UserDalleGen(),
        new UserCodex(),
        new UserGoogle()
    ]

    const data: ChatStoreUserData = {
        usersMap: {},
        myUserId: "human",
    };

    defaultUsers.forEach((user) => {
        data.usersMap[user.id] = user;
    });

    return data;
};

export default {
    getDefault,
};
