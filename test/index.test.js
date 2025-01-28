import assert from 'assert'
import { Plugin } from './pluginLoader.js'
import { join } from 'path'
import fs from 'fs'

const PluginFolder = join(import.meta.dirname, './plugins')

let location = join(PluginFolder, 'dummy.js')
let pluginCount = 0

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

describe('Basic usage', function () {
  describe('Folders', function () {
    it('Folders exist?', function () {
      assert.ok(fs.existsSync(PluginFolder))
    })

    it('Reset condition', function () {
      if (fs.existsSync(location)) {
        fs.unlinkSync(location)
      }
      assert.ok(1)
    })

    it(`Add Folder '${PluginFolder}'`, async function () {
      await Plugin.addPluginFolder(PluginFolder)
      assert.ok(1)
    })
  })

  describe('Content', function () {
    it('Has added plugins?', function () {
      assert.notStrictEqual(Plugin.pluginCount, pluginCount)
      pluginCount = Plugin.pluginCount
    })

    const client = {
      sendMessage(id, message) {
        assert.match(id, /@/)
        assert.strictEqual(typeof message, 'object')
        assert.strictEqual(typeof message.text, 'string')
        console.log(`        [${id}] ${message.text}`)
      },
    }

    it('Calling the plugin', function () {
      const message = {
        key: {
          id: 'user@host.com',
        },
        message: 'Lorem ipsum',
      }
      const options = {
        isAdmin: false,
      }

      let isCommand = false
      for (let name in Plugin.plugins) {
        let plugin = Plugin.plugins[name]
        if (plugin.onCommand && typeof plugin.onCommand === 'function') {
          plugin.onCommand(message, client, options)
          isCommand = true
        }
      }
      assert.ok(isCommand, 'No Command Executed')
    })
  })
  describe('Watch changes', function () {
    it('Writing File', async function () {
      let content = `import { Plugin } from '../pluginLoader.js'\n\nPlugin.add('dummy', { limit: 3, onCommand() {} })\n`
      await fs.promises.writeFile(location, content)
    })

    it('Is plugin adding function?', async function () {
      await sleep(20)
      assert.notStrictEqual(Plugin.pluginCount, pluginCount)
      pluginCount = Plugin.pluginCount
    })

    it('Make a change', async function () {
      let content = `import { Plugin } from '../pluginLoader.js'\n\nPlugin.add('dummy', { limit: 4, onCommand() { return true } })`
      await fs.promises.writeFile(location, content)
    })

    it('Plugin counts must the same', async function () {
      await sleep(20)
      assert.strictEqual(Plugin.pluginCount, pluginCount)
      pluginCount = Plugin.pluginCount
    })
  })

  describe('Delete file', function () {
    it('Is file exists?', async function () {
      assert.ok(fs.existsSync(location), 'File found')
    })

    it('Deleting file', async function () {
      await fs.promises.unlink(location)
    })

    it('See changes', async function () {
      await sleep(20)
      assert.notStrictEqual(Plugin.pluginCount, pluginCount)
      pluginCount = Plugin.pluginCount
    })
  })

  describe('Manual usage', function () {
    it('Add plugin', function () {
      Plugin.add('manual', {
        limit: 5,
        onCommand() {
          return 'manual'
        },
      })
      assert.ok(1)
    })

    it('See changes', async function () {
      await sleep(20)
      assert.notStrictEqual(Plugin.pluginCount, pluginCount)
      pluginCount = Plugin.pluginCount
    })
  })
})
