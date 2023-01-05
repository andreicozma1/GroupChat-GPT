<template>
  <q-btn-dropdown flat rounded icon="settings" label="Prefs" size="12px">
    <q-card>
      <q-card-section class="q-py-sm">
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
      <q-card-section class="q-py-sm q-px-none">
        <q-list>
          <!--          Members -->
          <q-expansion-item expand-separator icon="people" label="Members" popup>

            <q-card flat bordered>
              <q-list separator>
                <q-item dense
                        v-for="member in getThreadUsers()" :key="member">
                  <q-item-section>
                    <q-item-label>{{ member.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </q-expansion-item>

          <!--          General -->
          <q-expansion-item expand-separator icon="settings" label="General" popup>
            <q-card flat bordered>
              <q-list separator>
                <q-item dense>
                  <q-checkbox v-model="comp.getThread.prefs.orderedResponses"
                              v-if="comp.getThread.prefs"
                              label="Ordered Responses"
                              size="xs"
                              left-label/>
                  <q-checkbox v-else
                              :model-value="undefined"
                              label="Ordered Responses"
                              size="xs"
                              left-label>
                    <q-tooltip>Could not load thread preferences</q-tooltip>
                  </q-checkbox>
                </q-item>

                <q-item dense>
                  <q-checkbox v-model="comp.getThread.prefs.showDeletedMessages"
                              v-if="comp.getThread.prefs"
                              label="Show Deleted Messages"
                              size="xs"
                              left-label/>
                  <q-checkbox v-else
                              :model-value="undefined"
                              label="Show Deleted Messages"
                              size="xs"
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

const comp = useCompStore();

const getThreadUsers = () => {
  const res = comp.getThread.joinedUserIds.map((id) => comp.getUser(id));
  return res;
};

watch(() => comp.getThread.prefs, () => {
  console.log("Thread prefs changed");
  comp.updateCache();
});

</script>