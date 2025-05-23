import { appStore } from "../app"
import { builderStore } from "../builder"
import { derivedMemo } from "@budibase/frontend-core"

export const snippets = derivedMemo(
  [appStore, builderStore],
  ([$appStore, $builderStore]) => {
    return $builderStore?.snippets || $appStore?.application?.snippets || []
  }
)
