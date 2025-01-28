import { Plugin } from '../pluginLoader.js'

console.log('hi from example.js')

Plugin.add('example', {
    prefix: [],
    command: [],
    help: [],
    tags: [],
    limit: 1,

    priority: 0,
    preHandle() {},
    preCommand() {},
    onCommand(message, client) {
        client.sendMessage(message.key.id, { text: message.message })
    },
    postCommand() {},
    postHandler() {},
})