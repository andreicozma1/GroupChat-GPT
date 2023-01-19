<template>
    <q-item-label :lines="1"
                  caption
                  class="q-px-xs q-my-auto"
                  style="cursor: pointer"
                  @click.stop="onClick"
                  @click.right.stop="onRightClick">
        {{ parsedDate }}
    </q-item-label>

</template>

<script lang="ts"
        setup>

import {dateToLocaleStr, dateToTimeAgo} from "../util/DateUtils";
import {computed, PropType, ref} from "vue";

const props = defineProps({
	date: {
		type: [String, Number, Date] as PropType<Date | string | number>,
		required: true
	},
	prefix: {
		type: String,
		required: false,
	},
	suffix: {
		type: String,
		required: false,
	}
});

const dates = Array.isArray(props.date) ? props.date : [props.date];

const toggleState = ref(0);
const dateStringType = ref(false);

const parsedDate = computed(() => {
	const date = dates[toggleState.value];
	let dateStr = dateStringType.value ? dateToLocaleStr(date) : dateToTimeAgo(date)
	if (props.prefix) dateStr = props.prefix + " " + dateStr;
	if (props.suffix) dateStr = dateStr + " " + props.suffix;
	return dateStr;
})

const onClick = () => {
	dateStringType.value = !dateStringType.value;
}

const onRightClick = () => {
	toggleState.value = (toggleState.value + 1) % dates.length;
}

</script>