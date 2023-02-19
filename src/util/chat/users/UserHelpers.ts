import {User, UserTypes} from "src/util/chat/users/User";
import {ApiReqTypes} from "src/util/openai/ApiReq";

export class UserDalleGen extends User {
    constructor() {
        super("gen_image", "Generate Image", UserTypes.HELPER);
        this.icon = "image"
        this.showInMembersInfo = false;

        this.apiReqType = ApiReqTypes.OAI_CREATE_IMAGE;
        this.apiReqOpts = {
            n: 1,
            size: "256x256",
        }
    }
}

export class UserGoogle extends User {
    constructor() {
        super("google", "Google Search", UserTypes.HELPER);
        this.icon = "search";
        this.defaultJoin = true;

        this.apiReqType = ApiReqTypes.GOOGLE_SEARCH;
        this.apiReqOpts = {
            page: 0,
            safe: false, // Safe Search
            parse_ads: false, // If set to true sponsored results will be parsed
            additional_params: {
                // add additional parameters here, see https://moz.com/blog/the-ultimate-guide-to-the-google-search-parameters and https://www.seoquake.com/blog/google-search-param/
                hl: 'en'
            },
        }
    }
}

