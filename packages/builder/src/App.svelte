<script>
  import { Router } from "@roxi/routify"
  import { routes } from "../.routify/routes"
  import { NotificationDisplay, BannerDisplay, Context } from "@budibase/bbui"
  import { parse, stringify } from "qs"
  import LicensingOverlays from "@/components/portal/licensing/LicensingOverlays.svelte"
  import { setContext } from "svelte"

  setContext(Context.PopoverRoot, "body")

  const queryHandler = { parse, stringify }
</script>

<div class="banner-container" />
<BannerDisplay />
<NotificationDisplay />
<LicensingOverlays />
<Router {routes} config={{ queryHandler }} />
<div class="modal-container" />

<style>
  .modal-container {
    position: absolute;
  }
</style>
