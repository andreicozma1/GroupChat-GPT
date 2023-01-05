<template>
  <q-btn-dropdown flat rounded icon="settings" label="Prefs" size="12px">
    <q-card style="min-width: 320px">
      <q-card-section class="q-pt-md q-pb-sm justify-center flex">
        <q-btn-group rounded flat>
          <q-btn
              color="orange"
              icon-right="clear"
              label="Thread"
              no-caps
              outline
              @click="comp.clearThread"
          />
          <q-btn
              color="red"
              icon-right="delete_forever"
              label="Cache"
              no-caps
              outline
              @click="comp.clearCache"
          />
        </q-btn-group>
      </q-card-section>

      <q-card-section class="q-py-sm">
        <q-list>
          <q-expansion-item expand-separator icon="people" label="Members" popup>

            <q-card flat bordered>
              <q-list separator>
                <q-item v-for="member in getThreadUsers()" :key="member">
                  <q-item-section avatar>
                    <q-avatar :icon="member.icon" size="sm" rounded/>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ member.name }}</q-item-label>
                    <q-item-label caption>
                      {{ comp.getThread.prefs.shownUsers[member.key] ? "Visible" : "Hidden" }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-checkbox v-model="comp.getThread.prefs.shownUsers[member.key]"
                                v-if="comp.getThread.prefs?.shownUsers"
                                color="primary"/>
                    <q-checkbox v-else
                                :model-value="undefined"
                                color="primary">
                      <q-tooltip>Could not load thread preferences</q-tooltip>
                    </q-checkbox>

                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </q-expansion-item>

          <q-expansion-item expand-separator icon="settings" label="General" popup>
            <q-card flat bordered>
              <q-list separator>
                <q-item dense>
                  <q-checkbox v-model="comp.getThread.prefs.orderedResponses"
                              v-if="comp.getThread.prefs"
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
                  <q-checkbox v-model="comp.getThread.prefs.showDeletedMessages"
                              v-if="comp.getThread.prefs"
                              label="Show Deleted Messages"
                              left-label/>
                  <q-checkbox v-else
                              :model-value="undefined"
                              label="Show Deleted Messages"
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
<script setup lang="ts">
import {useCompStore} from "stores/compStore";
import {watch} from "vue";
import {ChatUser} from "src/util/chat/ChatModels";

const comp = useCompStore();

const getThreadUsers = (): ChatUser[] => {
  return comp.getThread.joinedUserIds.map((id) => comp.getUser(id));
};

watch(() => comp.getThread.prefs, () => {
  console.log("Thread prefs changed");
  comp.updateCache();
});

</script>