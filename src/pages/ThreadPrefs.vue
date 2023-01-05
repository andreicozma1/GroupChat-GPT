<template>
  <q-btn-dropdown color="primary" rounded icon="settings">
    <q-card>
      <q-card-section class="q-pa-sm">
        <q-list>
          <q-item dense>
            <q-checkbox v-model="comp.getThread.orderedResponses" label="Ordered Responses" left-label/>
          </q-item>
          <q-item dense>
            <q-checkbox v-model="comp.getThread.hideCoordinator" label="Hide Coordinator" left-label/>
          </q-item>
          <q-item dense>
            <q-checkbox v-model="comp.getThread.showDeletedMessages" label="Show Deleted Messages" left-label/>
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

const comp = useCompStore();

</script>