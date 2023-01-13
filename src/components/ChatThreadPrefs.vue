<template>
    <q-btn-dropdown flat icon="settings" label="Prefs" rounded size="12px">
        <q-card style="min-width: 320px">
            <q-card-section class="q-py-sm">
                <q-list>
                    <q-expansion-item
                            expand-separator
                            icon="people"
                            label="Members"
                            popup>
                        <q-card bordered flat>
                            <q-list separator>
                                <q-item v-for="member in getThreadUsers()" :key="member">
                                    <q-item-section side>
                                        <q-avatar :icon="member.icon" rounded size="sm"/>
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>
                                            {{ member.name }}
                                        </q-item-label>
                                        <q-item-label caption>
                                            ID: {{ member.id }} ({{ member.type }})
                                        </q-item-label>
                                    </q-item-section>
                                    <q-item-section side>
                                        <q-checkbox
                                                v-if="store.getActiveThread.prefs.hiddenUserIds"
                                                :model-value="!isUserHidden(member)"
                                                color="primary"
                                                @update:model-value="toggleHiddenUser(member)"
                                        />
                                        <q-checkbox v-else :model-value="undefined" color="primary">
                                            <q-tooltip>
                                                Could not load user's hidden/visible state from thread preferences
                                            </q-tooltip>
                                        </q-checkbox>
                                    </q-item-section>
                                </q-item>
                            </q-list>
                        </q-card>
                    </q-expansion-item>

                    <q-expansion-item
                            expand-separator
                            icon="settings"
                            label="General"
                            popup
                    >
                        <q-card bordered flat>
                            <q-list separator>
                                <q-item dense>
                                    <q-checkbox
                                            v-if="store.getActiveThread.prefs"
                                            v-model="store.getActiveThread.prefs.orderedResponses"
                                            label="Ordered Responses"
                                            left-label
                                    />
                                    <q-checkbox
                                            v-else
                                            :model-value="undefined"
                                            label="Ordered Responses"
                                            left-label
                                    >
                                        <q-tooltip>Could not load thread preferences</q-tooltip>
                                    </q-checkbox>
                                </q-item>

                                <q-item dense>
                                    <q-checkbox
                                            v-if="store.getActiveThread.prefs"
                                            v-model="store.getActiveThread.prefs.dontShowMessagesHiddenInPrompts"
                                            label="Hide Ignored Messages"
                                            left-label
                                    />
                                    <q-checkbox
                                            v-else
                                            :model-value="undefined"
                                            label="Hide Ignored Messages"
                                            left-label
                                    >
                                        <q-tooltip>Could not load thread preferences</q-tooltip>
                                    </q-checkbox>
                                </q-item>
                            </q-list>
                        </q-card>
                    </q-expansion-item>
                </q-list>
            </q-card-section>
        </q-card>
    </q-btn-dropdown>
</template>
<script lang="ts" setup>
import {useChatStore} from "stores/chatStore";
import {User} from "src/util/users/User";

const store = useChatStore();

const getThreadUsers = (): User[] => {
	return store.getActiveThread.joinedUserIds.map((id) => store.getUserConfig(id));
};

const isUserHidden = (user: User): boolean => {
	return store.getActiveThread.prefs.hiddenUserIds.includes(user.id);
};

const toggleHiddenUser = (user: User) => {
	const userId = user.id;
	if (isUserHidden(user)) {
		store.getActiveThread.prefs.hiddenUserIds = store.getActiveThread.prefs.hiddenUserIds.filter((id) => id !== userId);
	} else {
		store.getActiveThread.prefs.hiddenUserIds.push(userId);
	}
};

</script>
