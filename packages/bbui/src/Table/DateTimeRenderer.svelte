<script lang="ts">
  import dayjs from "dayjs"

  export let value: string | Date
  export let schema: { timeOnly?: boolean; dateOnly?: boolean }

  // adding the 0- will turn a string like 00:00:00 into a valid ISO
  // date, but will make actual ISO dates invalid
  $: time = new Date(`0-${value}`)
  $: isTimeOnly = !isNaN(time as any) || schema?.timeOnly
  $: isDateOnly = schema?.dateOnly
  $: format = isTimeOnly
    ? "HH:mm:ss"
    : isDateOnly
      ? "MMMM D YYYY"
      : "MMMM D YYYY, HH:mm"
</script>

<div>
  {dayjs(isTimeOnly ? time : value).format(format)}
</div>

<style>
  div {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
