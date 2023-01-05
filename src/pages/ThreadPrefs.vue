<template>
  <q-btn-dropdown color="primary" rounded icon="settings">
    <q-card>
      <q-card-section class="q-pa-sm">
        <q-list>
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
            <q-checkbox v-model="comp.getThread.prefs.hideCoordinator"
                        v-if="comp.getThread.prefs"
                        label="Hide Coordinator"
                        left-label/>
            <q-checkbox v-else
                        :model-value="undefined"
                        label="Hide Coordinator"
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
          <q-item dense>
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
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

  </q-btn-dropdown>
</template>
<script setup lang="ts">
import {useCompStore} from "stores/compStore";
import {watch} from "vue";

const comp = useCompStore();

watch(() => comp.getThread.prefs, () => {
  console.log("Thread prefs changed");
  comp.updateCache();
});

</script>