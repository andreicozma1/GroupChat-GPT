<template>
    <q-btn-dropdown flat icon="settings" label="Prefs" rounded size="12px">
        <q-card style="min-width: 320px">
            <!--            <q-card-section class="q-pt-md q-pb-sm justify-center flex">-->
            <!--               -->
            <!--            </q-card-section>-->

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
                                    <q-item-section avatar>
                                        <q-avatar :icon="member.icon" rounded size="sm"/>
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>{{ member.name }}</q-item-label>
                                        <q-item-label caption>
                                            {{
                                                isUserHidden(member)
                                                        ? "Hidden"
                                                        : "Visible"
                                            }}
                                        </q-item-label>
                                    </q-item-section>
                                    <q-item-section side>
                                        <q-checkbox
                                                v-if="comp.getThread.prefs.hiddenUserIds"
                                                :model-value="!isUserHidden(member)"
                                                @update:model-value="toggleHiddenUser(member)"
                                                color="primary"
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
                                            v-if="comp.getThread.prefs"
                                            v-model="comp.getThread.prefs.orderedResponses"
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
                                            v-if="comp.getThread.prefs"
                                            v-model="comp.getThread.prefs.hideIgnoredMessages"
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
import {useCompStore} from "stores/compStore";
import {watch} from "vue";
import {ChatUser} from "src/util/assistant/AssistantModels";

const comp = useCompStore();

const getThreadUsers = (): ChatUser[] => {
	return comp.getThread.joinedUserIds.map((id) => comp.getUserConfig(id));
};

const isUserHidden = (user: ChatUser): boolean => {
	return comp.getThread.prefs.hiddenUserIds.includes(user.id);
};

const toggleHiddenUser = (user: ChatUser) => {
	const userId = user.id;
	if (isUserHidden(user)) {
		comp.getThread.prefs.hiddenUserIds = comp.getThread.prefs.hiddenUserIds.filter((id) => id !== userId);
	} else {
		comp.getThread.prefs.hiddenUserIds.push(userId);
	}
};

watch(comp.getThread, () => comp.saveData());
</script>
