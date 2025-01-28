import { Plugin } from '../pluginLoader.js'

console.log('hi from example2.js')

Plugin.add('example2', {
    prefix: [],
    command: [],
    help: [],
    tags: [],
    limit: 2,

    priority: 2,
    preHandle() {},
    preCommand() {},
    onCommand(message, client) {
        client.sendMessage(message.key.id, { text: message.message })
    },
    postCommand() {},
    postHandler() {},
})