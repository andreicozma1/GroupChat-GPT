<template>
    <q-btn-dropdown flat icon="settings" label="Prefs" rounded size="12px">
        <q-card style="min-width: 320px">
            <q-card-section class="q-py-sm">
                <q-list>
                    <q-expansion-item expand-separator
                                      icon="people"
                                      label="Members"
                                      popup>
                        <q-card bordered flat>
                            <q-list separator>
                                <q-item v-for="user in threadUsers" :key="user">
                                    <q-item-section side>
                                        <q-avatar :icon="user.icon" rounded size="sm"/>
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>
                                            {{ user.name }}
                                        </q-item-label>
                                        <q-item-label caption>
                                            ID: {{ user.id }} ({{ user.type }})
                                        </q-item-label>
                                    </q-item-section>
                                    <q-item-section side>
                                        <q-checkbox :model-value="isUserVisible(user)"
                                                    color="primary"
                                                    @update:model-value="toggleUserVisibility(user)"/>
                                    </q-item-section>
                                </q-item>
                            </q-list>
                        </q-card>
                    </q-expansion-item>

                    <q-expansion-item expand-separator
                                      icon="settings"
                                      label="General"
                                      popup>
                        <q-card bordered flat>
                            <q-list separator>
                                <q-item dense>
                                    <q-checkbox v-if="activeThread.prefs"
                                                v-model="activeThread.prefs.orderedResponses"
                                                label="Ordered Responses"
                                                left-label/>
                                    <q-checkbox v-else
                                                :model-value="undefined"
                                                label="Ordered Responses"
                                                left-label>
                                        <q-tooltip>Could not load thread preferences</q-tooltip>
                                    </q-checkbox>
                                </q-item>

                                <q-item dense>
                                    <q-checkbox v-if="activeThread.prefs"
                                                v-model="activeThread.prefs.hideIgnoredMessages"
                                                label="Hide Ignored Messages"
                                                left-label/>
                                    <q-checkbox v-else
                                                :model-value="undefined"
                                                label="Hide Ignored Messages"
                                                left-label>
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
import {ChatThread} from "src/util/chat/ChatThread";
import {computed, ComputedRef} from "vue";

const store = useChatStore();
const activeThread: ComputedRef<ChatThread> = computed(() => store.getActiveThread());

const threadUsers: ComputedRef<User[]> = computed(() => {
	return activeThread.value.getJoinedUsers(store.getUserById);
});

const isUserVisible = (user: User): boolean => {
	return !activeThread.value.prefs.hiddenUserIds.includes(user.id);
};

const toggleUserVisibility = (user: User) => {
	console.log("toggleUserVisibility->user:", user);
	const userId = user.id;
	const thread: ChatThread = activeThread.value;
	if (isUserVisible(user)) {
		thread.prefs.hiddenUserIds = thread.prefs.hiddenUserIds.filter(
			(id) => id !== userId
		);
	} else {
		thread.prefs.hiddenUserIds.push(userId);
	}
};


</script>
