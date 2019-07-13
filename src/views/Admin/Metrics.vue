<template>
<div> {{users}} </div>
</template>

<script>
import UserService from '../../services/UserService'
import NetworkService from '../../services/NetworkService'
export default{
    data () {
        return {
            users: []
        }
        },
    mounted() {
        return NetworkService.getUsers(this).then(res => {
            this.users = res.data
            console.log(this.users)
            return this.users
        })
    }

    }
</script>

<style lang="scss" scoped>

</style>