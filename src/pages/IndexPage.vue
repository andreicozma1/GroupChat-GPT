<template>
  <!--  <q-page class="row items-center justify-evenly">-->
  <div class="full-width">
    <ChatThread/>
  </div>
  <!--  </q-page>-->
</template>

<script lang="ts" setup>
import ChatThread from "components/ChatThread.vue"
import { onMounted } from "vue"
import { useCompStore } from "stores/compStore"

const comp = useCompStore()

const getAIResponse = async () => {
  const prompt = {
    prompt     : "Hello, how are you?",
    ignoreCache: false
  }
  comp.genTextCompletion(prompt).then((res) => {
    comp.pushAIMessage(res)
  })
}

onMounted(() => {
  getAIResponse()
})
</script>
