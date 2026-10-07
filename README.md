# Dashboard Collections

Custom Lovelace strategies for Home Assistant that build dashboards from filtered collections of entities, such as temperature, humidity or batteries, grouped by area.

## Features

- `custom:collections` dashboard strategy, available from **Add dashboard**. Each collection becomes a view, with one section per floor, then areas without a floor, then entities without an area.
- `custom:collection` section strategy, usable in any sections view
- Editors for both, so collections and filters can be set up without YAML

## Filters

Each collection has a list of filters. An entity is shown when it matches any filter in the list, and it matches a filter when it matches every key set in that filter. Hidden entities are left out. Configuration and diagnostic entities are left out too, unless the collection or section sets `include_diagnostic: true`. Many integrations mark battery sensors as diagnostic.

| Key | Matches |
| --- | --- |
| `domain` | Entity domain, for example `sensor` |
| `device_class` | Device class, for example `temperature` |
| `integration` | Integration that provides the entity, for example `zha` |
| `area` | Area ID of the entity, or of its device |
| `floor` | Floor ID of that area |
| `label` | Label ID on the entity |
| `name` | Every word appears in the entity name or ID |

Each key except `name` takes one value or a list.

## Install with HACS

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=timmo001&repository=ha-dashboard-collections&category=plugin)

1. Open the button above to add this repository in HACS.
2. If you add it manually, open HACS, go to the top-right menu, choose `Custom repositories`, add `https://github.com/timmo001/ha-dashboard-collections`, and select `Dashboard`.
3. Install the repository from HACS.
4. Open `Settings -> Dashboards -> three dots menu -> Resources`.
5. Add this Lovelace resource:

   - URL: `/hacsfiles/ha-dashboard-collections/ha-dashboard-collections.js`
   - Type: `module`

6. Reload Lovelace resources or refresh Home Assistant.

## Use as a full dashboard

Create a dashboard from `Settings -> Dashboards -> Add dashboard` and choose **Collections**. Open the dashboard, choose **Edit dashboard**, then add collections and their filters. Or use YAML:

```yaml
strategy:
  type: custom:collections
  collections:
    - title: Temperature
      icon: mdi:thermometer
      filters:
        - domain: sensor
          device_class: temperature
    - title: Batteries
      icon: mdi:battery
      include_diagnostic: true
      filters:
        - device_class: battery
```

Each collection becomes a view. Besides `title`, `icon` and `filters`, a collection can set `show_icon_and_title: true` to show both in the view tab, and `path` to choose the view's URL. Without a `path`, the URL comes from the title.

## Use as a section

In a sections view, add a section, open its YAML editor and replace the contents with:

```yaml
strategy:
  type: custom:collection
  heading:
    heading: Temperatures
    icon: mdi:thermometer
  filters:
    - domain: sensor
      device_class: temperature
```

The section shows every matching entity grouped by area, with entities without an area last. `heading` is optional and takes the same options as Home Assistant's heading card, without `type`. After saving, from Home Assistant 2026.10 its heading and filters can be edited in the section's editor without YAML.

## Local development setup

The local publish flow copies the built bundle into `/config/www/community/ha-dashboard-collections/` over SSH with `rsync`, so your development machine needs `ssh` and `rsync`, and your Home Assistant instance needs SSH access set up first.

If you run Home Assistant OS or Supervised, you can use the SSH app:

[![Open your Home Assistant instance and show the dashboard of an add-on.](https://my.home-assistant.io/badges/supervisor_addon.svg)](https://my.home-assistant.io/redirect/supervisor_addon/?addon=core_ssh)

1. Install the SSH app, refer to its setup instructions, and make sure you can log in over SSH before running this script.
2. Copy `.env.example` to `.env`.
3. Set `PUBLISH_TARGET` to your Home Assistant SSH target, for example `root@homeassistant.local` or another SSH user/host that can write to `/config/www`.
4. Optionally set `PUBLISH_PORT` if your SSH service is not on port `22`.
5. Run `pnpm publish-to-local`.
6. Open `Settings -> Dashboards -> three dots menu -> Resources`.
7. Add this Lovelace resource:

   - URL: `/local/community/ha-dashboard-collections/ha-dashboard-collections.js`
   - Type: `module`

8. Reload Lovelace resources or refresh Home Assistant.

## Development

```bash
pnpm install
pnpm run build
pnpm run lint
pnpm run check
```

`pnpm run build` type-checks and bundles in parallel. `pnpm run lint` runs Oxlint. `pnpm run check` rebuilds the bundle and checks the generated JavaScript syntax. Git commits run lint and check in parallel through a `pre-commit` hook.

## Release layout

- HACS release asset: `ha-dashboard-collections.js`
- Local build output: `dist/ha-dashboard-collections.js`
- Local publish target: `/config/www/community/ha-dashboard-collections/ha-dashboard-collections.js`
- Recommended local dev resource URL: `/local/community/ha-dashboard-collections/ha-dashboard-collections.js`
