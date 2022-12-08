<template>
  <q-page class="row items-center justify-evenly">
    <example-component
        :meta="meta"
        :todos="todos"
        active
        title="Example component"
    ></example-component>
  </q-page>
</template>

<script lang="ts" setup>
import { Meta, Todo } from "components/models"
import ExampleComponent from "components/ExampleComponent.vue"
import { ref } from "vue"

const todos = ref<Todo[]>([
  {
    id     : 1,
    content: "ct1"
  }, {
    id     : 2,
    content: "ct2"
  }, {
    id     : 3,
    content: "ct3"
  }, {
    id     : 4,
    content: "ct4"
  }, {
    id     : 5,
    content: "ct5"
  }
])
const meta = ref<Meta>({
  totalCount: 1200
})
</script>
