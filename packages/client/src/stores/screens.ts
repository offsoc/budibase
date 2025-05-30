import { derived } from "svelte/store"
import { routeStore } from "./routes"
import { builderStore } from "./builder"
import { appStore } from "./app"
import { orgStore } from "./org"
import { dndIndex, dndParent, dndSource } from "./dnd"
import { RoleUtils } from "@budibase/frontend-core"
import { findComponentById, findComponentParent } from "../utils/components.js"
import { Helpers } from "@budibase/bbui"
import { DNDPlaceholderID, ScreenslotID, ScreenslotType } from "@/constants"
import {
  Screen,
  ScreenProps,
  ScreenVariant,
  Layout,
  Component,
} from "@budibase/types"

const createScreenStore = () => {
  const store = derived(
    [
      appStore,
      routeStore,
      builderStore,
      orgStore,
      dndParent,
      dndIndex,
      dndSource,
    ],
    ([
      $appStore,
      $routeStore,
      $builderStore,
      $orgStore,
      $dndParent,
      $dndIndex,
      $dndSource,
    ]) => {
      let activeLayout: Layout | undefined, activeScreen: Screen | undefined
      let screens: Screen[]
      if ($builderStore.inBuilder) {
        // Use builder defined definitions if inside the builder preview
        activeScreen = Helpers.cloneDeep($builderStore.screen!)
        screens = [activeScreen]

        // Attach meta
        const errors = $builderStore.componentErrors || {}
        const attachComponentMeta = (component: ScreenProps) => {
          component._meta = { errors: errors[component._id!] || [] }
          component._children?.forEach(attachComponentMeta)
        }
        attachComponentMeta(activeScreen.props)
      } else {
        // Find the correct screen by matching the current route
        screens = $appStore.screens || []
        const { activeRoute } = $routeStore
        if (activeRoute) {
          activeScreen = Helpers.cloneDeep(
            screens.find(screen => screen._id === activeRoute.screenId)
          )
        }

        // Legacy - find the custom layout for the selected screen
        if (activeScreen) {
          const screenLayout = $appStore.layouts?.find(
            layout => layout._id === activeScreen!.layoutId
          )
          if (screenLayout) {
            activeLayout = screenLayout
          }
        }
      }

      // Insert DND placeholder if required
      if (activeScreen && $dndParent && $dndIndex != null) {
        const { selectedComponentId } = $builderStore

        // Extract and save the selected component as we need a reference to it
        // later, and we may be removing it
        let selectedParent = findComponentParent(
          activeScreen.props,
          selectedComponentId
        )

        // Remove selected component from tree if we are moving an existing
        // component
        if (!$dndSource!.isNew && selectedParent) {
          selectedParent._children = selectedParent._children?.filter(
            x => x._id !== selectedComponentId
          )
        }

        // Insert placeholder component
        const componentToInsert: Component = {
          _instanceName: "",
          _component: "@budibase/standard-components/container",
          _id: DNDPlaceholderID,
          _styles: {
            normal: {
              width: `${$dndSource?.bounds?.width || 400}px`,
              height: `${$dndSource?.bounds?.height || 200}px`,
              opacity: 0,
              "--default-width": $dndSource?.bounds?.width || 400,
              "--default-height": $dndSource?.bounds?.height || 200,
            },
          },
          static: true,
        }
        let parent = findComponentById(activeScreen.props, $dndParent)
        if (parent) {
          if (!parent._children?.length) {
            parent._children = [componentToInsert]
          } else {
            parent._children.splice($dndIndex, 0, componentToInsert)
          }
        }
      }

      type ScreenWithRank = Screen & {
        rank: number
      }

      // Assign ranks to screens, preferring higher roles and home screens
      screens.forEach(screen => {
        const roleId = screen.routing.roleId
        let rank = RoleUtils.getRolePriority(roleId)
        if (screen.routing.homeScreen) {
          rank += 100
        }
        ;(screen as ScreenWithRank).rank = rank
      })

      // Sort screens so the best route is first
      screens = screens.sort((a: any, b: any) => {
        // First sort by rank
        if (a.rank !== b.rank) {
          return a.rank > b.rank ? -1 : 1
        }
        // Then sort alphabetically
        return a.routing.route < b.routing.route ? -1 : 1
      })

      // If we don't have a legacy custom layout, build a layout structure
      // from the screen navigation settings
      if (!activeLayout) {
        let layoutSettings: Partial<Layout> = {
          navigation: "None",
          pageWidth: activeScreen?.width || "Large",
          embedded: $appStore.embedded,
        }
        if (activeScreen?.showNavigation) {
          layoutSettings = {
            ...layoutSettings,
            ...($builderStore.navigation || $appStore.application?.navigation),
          }

          // Default navigation to top
          if (!layoutSettings.navigation) {
            layoutSettings.navigation = "Top"
          }

          // Default title to app name
          if (!layoutSettings.title && !layoutSettings.hideTitle) {
            layoutSettings.title = $appStore.application?.name
          }

          // Default to the org logo
          if (!layoutSettings.logoUrl) {
            layoutSettings.logoUrl = $orgStore?.logoUrl
          }
        }
        activeLayout = {
          _id: "layout",
          props: {
            _component: "@budibase/standard-components/layout",
            _children: [
              {
                _component: ScreenslotType,
                _id: ScreenslotID,
                _styles: {
                  normal: {
                    flex: "1 1 auto",
                    display: "flex",
                    "flex-direction": "column",
                    "justify-content": "flex-start",
                    "align-items": "stretch",
                  },
                },
              },
            ],
            ...layoutSettings,
          },
        }
      }
      return { screens, activeLayout, activeScreen }
    }
  )

  return {
    subscribe: store.subscribe,
  }
}

export const screenStore = createScreenStore()

export const isGridScreen = derived(screenStore, $screenStore => {
  return (
    $screenStore.activeScreen?.props?.layout === "grid" ||
    $screenStore.activeScreen?.variant === ScreenVariant.PDF
  )
})
