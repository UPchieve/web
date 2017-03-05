<template>
	<div class="row">
		<div class="col-sm-12">
		<template v-if="!user.isVolunteer">
			<iframe src="https://docs.google.com/forms/d/e/1FAIpQLSfpLjDDdjw9eE9GAg9r-AMotDo-SRlM1eO9h6k9Mw5ZSp0J_Q/viewform?embedded=true" width="1200" height="1000" frameborder="0" marginheight="0" marginwidth="0">Loading...</iframe>
		</template>
		<template v-if="user.isVolunteer">
			<iframe src="https://docs.google.com/forms/d/e/1FAIpQLSc9doxOTqCcf5286LWPl3SYuJalBw3MurgkRJvrsod8ZId0tw/viewform?embedded=true" width="760" height="500" frameborder="0" marginheight="0" marginwidth="0">Loading...</iframe>
		</template>
	</div>
</template>

<script>
export default {
}
</script>

<style scoped>
</style>
