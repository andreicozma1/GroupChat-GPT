<template>
    <q-avatar :size="size"
              color="grey-3"
              round
              style="outline: 1px solid #ccc">
        <img :src="url"
             alt="User Avatar">
    </q-avatar>
</template>
<script lang="ts"
        setup>

import {defineProps} from 'vue'

const props = defineProps({
							  url: {
								  type: String,
								  required: true
							  },
							  size: {
								  type: String,
								  default: 'md'
							  }
						  })
</script>