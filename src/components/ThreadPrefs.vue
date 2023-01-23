<template>
    <q-btn-dropdown
            class="bg-white text-primary"
            flat
            icon="tune"
            rounded
            size="12px"
    >
        <q-card style="min-width: 320px">
            <q-card-section class="q-py-sm">
                <q-list>
                    <q-input
                            v-model="newThreadName"
                            :rules="[val => val?.length >= 2 || 'Thread name must be at least 2 characters']"
                            clearable
                            dense
                            label="Thread Name"
                            outlined>
                        <template #append>
                            <q-btn
                                    :disable="!isNewThreadNameValid"
                                    color="green-4"
                                    dense
                                    icon="check"
                                    round
                                    size="sm"
                                    @click="saveThreadName"
                            />
                        </template>
                    </q-input>
                    <q-expansion-item
                            icon="people"
                            label="Joined Users"
                            v-bind="defaultExpansionItemProps"
                    >
                        <q-card bordered
                                flat>
                            <q-list separator>
                                <q-item v-for="user in chatStore.getActiveThreadUsers()"
                                        :key="user">
                                    <q-item-section side>
                                        <UserAvatar :url="user.getUserAvatarUrl()" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>
                                            <span class="text-weight-bold">
                                                {{ user.name }}
                                            </span>
                                        </q-item-label>
                                        <q-item-label>
                                            <q-chip :label="user.type.toUpperCase()"
                                                    class="q-ma-none"
                                                    color="green"
                                                    dense
                                                    outline
                                                    size="0.55rem">
                                            </q-chip>
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
                                        <CustomTooltip>Could not load thread preferences</CustomTooltip>
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
                                        <CustomTooltip>Could not load thread preferences</CustomTooltip>
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
import {computed, ComputedRef, Ref, ref, watch} from "vue";
import {User} from "src/util/chat/User";
import {Thread} from "src/util/chat/Thread";
import {smartNotify} from "src/util/SmartNotify";
import CustomTooltip from "components/CustomTooltip.vue";
import UserAvatar from "components/UserAvatar.vue";


const defaultExpansionItemProps = {
	defaultOpened: true,
	expandSeparator: true,
	popup: true,
}
const chatStore = useChatStore();
const activeThread: ComputedRef<Thread> = computed(() =>
													   chatStore.getActiveThread()
);

const newThreadName: Ref<string> = ref(activeThread.value.name);

const isNewThreadNameValid: ComputedRef<boolean> = computed(() => {
	if (newThreadName.value === activeThread.value.name) {
		return false;
	}
	if (newThreadName.value?.length < 2) {
		return false;
	}
	return true;
});

const saveThreadName = () => {
	if (!isNewThreadNameValid.value) {
		smartNotify("Please enter a valid new thread name");
	}
	activeThread.value.name = newThreadName.value;
	chatStore.saveState(true);
}

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
	chatStore.saveState();
});
</script>
