<template>
    <q-btn-dropdown
            class="bg-white text-primary"
            flat
            icon="settings"
            rounded
            size="12px"
    >
        <q-card style="min-width: 320px">
            <q-card-section class="q-py-sm">
                <q-list>
                    <q-expansion-item
                            icon="people"
                            label="Joined Users"
                            v-bind="defaultExpansionItemProps"
                    >
                        <q-card bordered
                                flat>
                            <q-list separator>
                                <q-item v-for="user in threadUsers"
                                        :key="user">
                                    <q-item-section side>
                                        <q-avatar :icon="user.icon"
                                                  rounded
                                                  size="sm" />
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
                                        <q-checkbox
                                                :model-value="isUserVisible(user)"
                                                color="primary"
                                                @update:model-value="toggleUserVisibility(user)"
                                        />
                                    </q-item-section>
                                </q-item>
                            </q-list>
                        </q-card>
                    </q-expansion-item>

                    <q-expansion-item
                            icon="settings"
                            label="Thread Prefs"
                            v-bind="defaultExpansionItemProps"
                    >
                        <q-card bordered
                                flat>
                            <q-list separator>
                                <q-item dense>
                                    <q-checkbox
                                            v-if="activeThread.prefs"
                                            v-model="activeThread.prefs.orderedResponses"
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
                                            v-if="activeThread.prefs"
                                            v-model="activeThread.prefs.hideIgnoredMessages"
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
<script lang="ts"
        setup>
import {useChatStore} from "stores/chatStore";
import {computed, ComputedRef, watch} from "vue";
import {User} from "src/util/chat/User";
import {Thread} from "src/util/chat/Thread";


const defaultExpansionItemProps = {
	defaultOpened: true,
	expandSeparator: true,
	popup: true,
}
const store = useChatStore();
const activeThread: ComputedRef<Thread> = computed(() =>
	store.getActiveThread()
);

const threadUsers: ComputedRef<User[]> = computed(() => {
	return activeThread.value.getJoinedUsers(store.getUserById);
});

const isUserVisible = (user: User): boolean => {
	return !activeThread.value.prefs.hiddenUserIds.includes(user.id);
};

const toggleUserVisibility = (user: User) => {
	console.log("toggleUserVisibility->user:", user);
	const userId = user.id;
	const thread: Thread = activeThread.value;
	console.log("toggleUserVisibility->thread.prefs.hiddenUserIds:", thread.prefs.hiddenUserIds);

	if (isUserVisible(user)) {
		thread.prefs.hiddenUserIds.push(userId);
		console.log("toggleUserVisibility->push:", thread.prefs.hiddenUserIds);
	} else {
		thread.prefs.hiddenUserIds = thread.prefs.hiddenUserIds.filter(
			(id) => id !== userId
		);
		console.log("toggleUserVisibility->filter:", thread.prefs.hiddenUserIds);
	}
};

watch(activeThread.value.prefs, () => {
	console.log("activeThread.prefs changed");
	store.saveState();
});
</script>
