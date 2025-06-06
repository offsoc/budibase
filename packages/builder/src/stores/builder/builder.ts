import { get } from "svelte/store"
import { createBuilderWebsocket } from "./websocket.js"
import { Socket } from "socket.io-client"
import { BuilderSocketEvent } from "@budibase/shared-core"
import { BudiStore } from "../BudiStore.js"
import { App } from "@budibase/types"

interface BuilderState {
  previousTopNavPath: Record<string, string>
  highlightedSetting: {
    key: string
    type: "info" | string
  } | null
  propertyFocus: string | null
  builderSidePanel: boolean
  hoveredComponentId: string | null
  websocket?: Socket
}

export const INITIAL_BUILDER_STATE: BuilderState = {
  previousTopNavPath: {},
  highlightedSetting: null,
  propertyFocus: null,
  builderSidePanel: false,
  hoveredComponentId: null,
}

export class BuilderStore extends BudiStore<BuilderState> {
  websocket?: Socket

  constructor() {
    super({ ...INITIAL_BUILDER_STATE })

    this.init = this.init.bind(this)
    this.refresh = this.refresh.bind(this)
    this.reset = this.reset.bind(this)
    this.highlightSetting = this.highlightSetting.bind(this)
    this.propertyFocus = this.propertyFocus.bind(this)
    this.hideBuilderSidePanel = this.hideBuilderSidePanel.bind(this)
    this.showBuilderSidePanel = this.showBuilderSidePanel.bind(this)
    this.setPreviousTopNavPath = this.setPreviousTopNavPath.bind(this)
    this.selectResource = this.selectResource.bind(this)
  }

  init(app: App) {
    if (!app?.appId) {
      console.error("BuilderStore: No appId supplied for websocket")
      return
    }
    if (!this.websocket) {
      this.websocket = createBuilderWebsocket(app.appId)
    }
  }

  refresh() {
    const currentState = get(this.store)
    this.store.set(currentState)
  }

  reset() {
    this.store.set({ ...INITIAL_BUILDER_STATE })
    this.websocket?.disconnect()
    this.websocket = undefined
  }

  highlightSetting(key?: string, type?: string) {
    this.update(state => ({
      ...state,
      highlightedSetting: key ? { key, type: type || "info" } : null,
    }))
  }

  propertyFocus(key: string | null) {
    this.update(state => ({
      ...state,
      propertyFocus: key,
    }))
  }

  showBuilderSidePanel() {
    this.update(state => ({
      ...state,
      builderSidePanel: true,
    }))
  }

  hideBuilderSidePanel() {
    this.update(state => ({
      ...state,
      builderSidePanel: false,
    }))
  }

  setPreviousTopNavPath(route: string, url: string) {
    this.update(state => ({
      ...state,
      previousTopNavPath: {
        ...(state.previousTopNavPath || {}),
        [route]: url,
      },
    }))
  }

  selectResource(id: string) {
    this.websocket?.emit(BuilderSocketEvent.SelectResource, {
      resourceId: id,
    })
  }
}

export const builderStore = new BuilderStore()
