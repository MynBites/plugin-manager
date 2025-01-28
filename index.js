// by @ariffb inspired from https://github.com/Nurutomo/mahbod/blob/main/src/util/PluginManager.ts
// modified by Nurutomo

import { join, relative, resolve } from 'path'
import syntaxerror from 'syntax-error'
import { promises, existsSync, watch } from 'fs'
import { defaultFilter, formatFilename, importFile } from './lib/util.js'
import EventEmitter from 'events'

export class PluginManager extends EventEmitter {
  watcher = {}
  plugins = {}
  pluginFiles = []
  pluginFolders = {}
  pluginFilter = defaultFilter
  __fn_id = 0

  constructor(rootDir, options = {}) {
    super(options)
    this.rootDir = rootDir
    this.logger = options.logger || console
  }

  get pluginFilesCount() {
    return this.pluginFiles.length
  }

  get pluginCount() {
    return Object.keys(this.plugins).length
  }

  async reloadAll() {
    this.plugins = {}
    for (let file of this.pluginFiles) {
      await importFile(file)
    }
  }

  /**
   * Wait for event to occur then return the event value
   * @param {string} eventName
   * @returns
   */
  waitForEvent(eventName) {
    return new Promise((resolve) => this.once(eventName, resolve))
  }

  async loadFolder(folder, recursiveRead, isFromReload) {
    const paths = await promises.readdir(folder)
    await Promise.all(
      paths.map(async (path) => {
        const resolved = join(folder, path)
        // trim file:// prefix because lstat will throw error
        const dirname = resolved
        try {
          const stats = await promises.lstat(dirname)
          // if folder
          if (!stats.isFile()) {
            // and if `recursiveRead` is true
            if (recursiveRead && !isFromReload) await this.addPluginFolder(dirname, recursiveRead)
            // return because import only can load file
            return
          }

          // if windows it will have file:// prefix because if not it will throw error
          await importFile(resolved)
        } catch (e) {
          this.logger?.error(e, `error while requiring ${resolved}`)
          // delete plugins[formatedFilename]
        }
      }),
    )
  }

  /**
   * load files from plugin folder as plugins
   * @param {string} pluginFolder
   * @param {boolean} recursiveRead if `'recursiveRead'` is true, it will load folder (call `this.addPluginFolder` function) inside pluginFolder not just load the files
   */
  async addPluginFolder(pluginFolder, recursiveRead) {
    const folder = resolve(pluginFolder)
    if (folder in this.watcher) return
    this.pluginFolders[folder] = recursiveRead

    this.loadFolder(folder, recursiveRead)

    const watching = watch(folder, (event, file) => {
      this.addPlugin(file, folder, event)
    })
    watching.on('close', () => this.deletePluginFolder(folder, true))
    this.watcher[folder] = watching
  }

  /**
   * It will delete and doesn't watch the folder
   * @param {string} folder
   * @param {boolean?} isAlreadyClosed
   */
  deletePluginFolder(folder, isAlreadyClosed = false) {
    const resolved = resolve(folder)
    if (!(resolved in this.watcher)) return
    if (!isAlreadyClosed) this.watcher[resolved].close()
    delete this.watcher[resolved]
    delete this.pluginFolders[resolved]
  }

  /**
   * add or reload file to load latest changes
   * @param {string} filename
   * @returns
   */
  async addPlugin(filename, folder, event) {
    if (!this.pluginFilter(filename)) return
    // trim file:// prefix because lstat will throw exception
    const file = join(folder, filename)
    const formatedFilename = file ///relative(file, this.rootDir)
    if (this.pluginFiles.includes(formatedFilename)) {
      if (existsSync(file)) {
        this.emit('update', formatFilename)
        this.logger?.info(`updated plugin - '${formatedFilename}'`)
      } else {
        this.emit('delete', formatFilename)
        this.logger?.warn(`deleted plugin - '${formatedFilename}'`)
        let index = this.pluginFiles.indexOf(formatedFilename)
        if (index > -1) this.pluginFiles.splice(index, 1)
      }
      return await this.reloadAll()
    } else {
      this.emit('new', formatFilename)
      this.logger?.info(`new plugin - '${formatedFilename}'`)
      this.pluginFiles.push(formatedFilename)
    }
    if (event !== 'change') return
    const src = await promises.readFile(file)
    // check syntax error
    let err = syntaxerror(src, filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    })
    if (err) this.logger?.error(err, `syntax error while loading '${formatedFilename}'`)
    else
      try {
        await importFile(file)
      } catch (e) {
        this.logger?.error(e, `error require plugin '${formatedFilename}'`)
        // delete plugins[formatedFilename]
      }
  }

  add(name, options) {
    let isExist = name in this.plugins
    this.emit(`${isExist ? 'update' : 'new'}.name`, name)
    this.logger?.info(`${isExist ? 'updated' : 'new'} plugin name - '${name}'`)
    this.plugins[name] = options
  }

  del(name) {
    this.emit('delete.name', name)
    this.logger?.info(`deleted plugin name - '${name}'`)
    delete this.plugins[name]
  }

  /**
   * Sorted plugins by of their key
   * @param {{
   *  [k: string]: any;
   * }} plugins
   * @returns {{
   *  [k: string]: any;
   * }}
   */
  sort(plugins) {
    return Object.fromEntries(
      Object.entries(plugins)
        //   .sort(([a], [b]) => a.localeCompare(b))
        .sort((A, B) => (A.priority || 0) - (B.priority || 0)),
    )
  }
}

export default PluginManager
