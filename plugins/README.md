# Local Claude Code plugins

A plugin bundles skills, agents, hooks and MCP servers so they can be shared across repos or toggled as a unit. Project-only tooling can stay in `.claude/`; move it here when it should be reusable.

## Structure

```
plugins/<plugin-name>/
├── .claude-plugin/plugin.json   # name, version, description (required)
├── skills/<skill>/SKILL.md
├── agents/<agent>.md
├── hooks/hooks.json
└── .mcp.json
```

`_template/` is a starting point: copy it, rename, and edit `plugin.json`.

## Using local plugins

To install from this repo, add a marketplace manifest at `.claude-plugin/marketplace.json` (repo root):

```json
{
  "name": "amazon-extension-plugins",
  "owner": { "name": "Your team" },
  "plugins": [{ "name": "my-plugin", "source": "./plugins/my-plugin", "description": "..." }]
}
```

Then in Claude Code: `/plugin marketplace add ./` and `/plugin install my-plugin@amazon-extension-plugins`.
