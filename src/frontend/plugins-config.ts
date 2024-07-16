import { EditorPluginType } from '@serlo/editor'

export function createPluginsConfig(testingSecret: string | null) {
  return {
    general: {
      testingSecret: testingSecret || undefined,
      enableTextAreaExercise: false,
    },
    multimedia: {
      allowedPlugins: [EditorPluginType.Image, EditorPluginType.Geogebra],
      explanation: {
        plugin: EditorPluginType.Rows,
        config: {
          allowedPlugins: [
            EditorPluginType.Text,
            EditorPluginType.Highlight,
            EditorPluginType.Equations,
            EditorPluginType.SerloTable,
          ],
        },
      },
    },
    spoiler: {
      allowedPlugins: [
        EditorPluginType.Text,
        EditorPluginType.Image,
        EditorPluginType.Equations,
        EditorPluginType.Multimedia,
        EditorPluginType.SerloTable,
        EditorPluginType.Highlight,
      ],
    },
    box: {
      allowedPlugins: [
        EditorPluginType.Text,
        EditorPluginType.Image,
        EditorPluginType.Equations,
        EditorPluginType.Multimedia,
        EditorPluginType.SerloTable,
        EditorPluginType.Highlight,
      ],
    },
  }
}
