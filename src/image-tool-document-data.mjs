// Owned projections from the complete formally published D186 model supplement.
export default {
  "definitions": {
    "ImageSupplyRequest": {
      "type": "object",
      "properties": {
        "attachmentRef": {
          "$ref": "#/definitions/Ref"
        }
      },
      "required": [
        "attachmentRef"
      ],
      "additionalProperties": false
    },
    "Ref": {
      "type": "string",
      "minLength": 1,
      "x-typeName": "Ref",
      "x-normalization": "NONE; exact Unicode scalar sequence; never trim/lower/NFC; not a path"
    },
    "MaterialSourcesProjection": {
      "type": "object",
      "properties": {
        "sessionRef": {
          "$ref": "#/definitions/Ref"
        },
        "turnRef": {
          "$ref": "#/definitions/Ref"
        },
        "turnRevision": {
          "$ref": "#/definitions/Ref"
        },
        "sourceMessageId": {
          "$ref": "#/definitions/Ref"
        },
        "messageDigest": {
          "$ref": "#/definitions/Digest"
        },
        "localContext": {
          "$ref": "#/definitions/SupplyLocalWorldContext"
        },
        "attachment": {
          "$ref": "#/definitions/AttachmentHint"
        },
        "media": {
          "$ref": "#/definitions/MediaBindingV6"
        },
        "imageBytes": {
          "$ref": "#/definitions/Bytes"
        },
        "catalogue": {
          "$ref": "#/definitions/Canvas_CatalogueHostFacts"
        },
        "materialSources": {
          "$ref": "#/definitions/World_MaterialSourcesHostFacts"
        }
      },
      "required": [
        "sessionRef",
        "turnRef",
        "turnRevision",
        "sourceMessageId",
        "messageDigest",
        "localContext",
        "attachment",
        "media",
        "imageBytes",
        "catalogue",
        "materialSources"
      ],
      "additionalProperties": false
    },
    "Digest": {
      "type": "string",
      "pattern": "^[0-9a-f]{64}$",
      "x-typeName": "Digest"
    },
    "SupplyLocalWorldContext": {
      "type": "object",
      "properties": {
        "worldRef": {
          "$ref": "#/definitions/Ref"
        },
        "connectionRef": {
          "$ref": "#/definitions/Ref"
        },
        "connectionIncarnationRef": {
          "$ref": "#/definitions/Ref"
        },
        "selectionRevision": {
          "$ref": "#/definitions/Ref"
        }
      },
      "required": [
        "worldRef",
        "connectionRef",
        "connectionIncarnationRef",
        "selectionRevision"
      ],
      "additionalProperties": false
    },
    "AttachmentHint": {
      "type": "object",
      "properties": {
        "attachmentId": {
          "$ref": "#/definitions/Ref"
        },
        "mediaType": {
          "$ref": "#/definitions/MediaType"
        },
        "bytes": {
          "$ref": "#/definitions/PositiveInt"
        },
        "width": {
          "$ref": "#/definitions/PositiveInt"
        },
        "height": {
          "$ref": "#/definitions/PositiveInt"
        }
      },
      "required": [
        "attachmentId",
        "mediaType",
        "bytes",
        "width",
        "height"
      ],
      "additionalProperties": false
    },
    "MediaType": {
      "enum": [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif"
      ],
      "x-typeName": "MediaType"
    },
    "PositiveInt": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "x-typeName": "PositiveInt"
    },
    "MediaBindingV6": {
      "type": "object",
      "properties": {
        "attachmentRef": {
          "$ref": "#/definitions/RefV6"
        },
        "storedBytesDigest": {
          "$ref": "#/definitions/DigestV6"
        },
        "projectionVariantId": {
          "anyOf": [
            {
              "$ref": "#/definitions/RefV6"
            },
            {
              "type": "null"
            }
          ]
        },
        "projectionBytesDigest": {
          "anyOf": [
            {
              "$ref": "#/definitions/DigestV6"
            },
            {
              "type": "null"
            }
          ]
        },
        "mediaType": {
          "$ref": "#/definitions/MediaTypeV6"
        },
        "bytes": {
          "$ref": "#/definitions/PositiveIntV6"
        },
        "width": {
          "$ref": "#/definitions/PositiveIntV6"
        },
        "height": {
          "$ref": "#/definitions/PositiveIntV6"
        }
      },
      "required": [
        "attachmentRef",
        "storedBytesDigest",
        "projectionVariantId",
        "projectionBytesDigest",
        "mediaType",
        "bytes",
        "width",
        "height"
      ],
      "additionalProperties": false
    },
    "RefV6": {
      "type": "string",
      "minLength": 1,
      "x-normalization": "NONE; exact Unicode scalar sequence; never trim/lower/NFC; not a path"
    },
    "DigestV6": {
      "type": "string",
      "pattern": "^[0-9a-f]{64}$"
    },
    "MediaTypeV6": {
      "enum": [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif"
      ]
    },
    "PositiveIntV6": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "Bytes": {
      "type": "array",
      "items": {
        "type": "integer",
        "minimum": 0,
        "maximum": 255
      },
      "minItems": 1,
      "x-in-process": "Uint8Array only; JSON example is an encoded byte list, never a wire replacement",
      "x-runtime-budget": "maxBytes checked against effective per-instance named budget; no second fixed schema ceiling; original default 33554432"
    },
    "Canvas_CatalogueHostFacts": {
      "type": "object",
      "properties": {
        "provider": {
          "$ref": "#/definitions/Canvas_FactsProviderIdentity"
        },
        "facts": {
          "$ref": "#/definitions/Canvas_CatalogueFacts"
        }
      },
      "required": [
        "provider",
        "facts"
      ],
      "additionalProperties": false
    },
    "Canvas_FactsProviderIdentity": {
      "type": "object",
      "properties": {
        "providerRef": {
          "$ref": "#/definitions/Canvas_Ref"
        },
        "providerRevision": {
          "$ref": "#/definitions/Canvas_Ref"
        }
      },
      "required": [
        "providerRef",
        "providerRevision"
      ],
      "additionalProperties": false,
      "x-typeName": "FactsProviderIdentity"
    },
    "Canvas_Ref": {
      "type": "string",
      "minLength": 1,
      "x-typeName": "Ref",
      "x-normalization": "NONE; exact Unicode scalar sequence; never trim/lower/NFC; not a path"
    },
    "Canvas_CatalogueFacts": {
      "x-typeName": "CatalogueFacts",
      "type": "object",
      "properties": {
        "profileVersion": {
          "const": "catalogue-facts/v1"
        },
        "connection": {
          "$ref": "#/definitions/Canvas_MaterialSourceConnection"
        },
        "catalogue": {
          "$ref": "#/definitions/Canvas_Catalogue"
        },
        "catalogueDigest": {
          "$ref": "#/definitions/Canvas_Digest"
        },
        "presentation": {
          "$ref": "#/definitions/Canvas_MaterialPresentationMap"
        },
        "orientationIndex": {
          "$ref": "#/definitions/Canvas_OrientationIndex"
        }
      },
      "required": [
        "profileVersion",
        "connection",
        "catalogue",
        "catalogueDigest",
        "presentation",
        "orientationIndex"
      ],
      "additionalProperties": false,
      "x-meaning": "The world source material vocabulary with names, colours and the neutral orientation index. presentation has exactly the Catalogue materials as keys; orientationIndex describes every orientation any material declares."
    },
    "Canvas_MaterialSourceConnection": {
      "x-typeName": "MaterialSourceConnection",
      "type": "object",
      "properties": {
        "worldRef": {
          "$ref": "#/definitions/Canvas_Ref"
        },
        "connectionRef": {
          "$ref": "#/definitions/Canvas_Ref"
        },
        "connectionIncarnationRef": {
          "$ref": "#/definitions/Canvas_Ref"
        }
      },
      "required": [
        "worldRef",
        "connectionRef",
        "connectionIncarnationRef"
      ],
      "additionalProperties": false
    },
    "Canvas_Catalogue": {
      "type": "object",
      "properties": {
        "profileVersion": {
          "const": "catalogue/v3"
        },
        "engineRevisions": {
          "$ref": "#/definitions/Canvas_EngineRevisions"
        },
        "emptyMaterialRef": {
          "$ref": "#/definitions/Canvas_Ref"
        },
        "materials": {
          "$ref": "#/definitions/Canvas_MaterialTagMap"
        }
      },
      "required": [
        "profileVersion",
        "engineRevisions",
        "emptyMaterialRef",
        "materials"
      ],
      "additionalProperties": false,
      "x-typeName": "Catalogue",
      "x-meaning": "The world source's own material vocabulary. emptyMaterialRef names the material that means an empty cell; it must be a key of materials."
    },
    "Canvas_EngineRevisions": {
      "type": "object",
      "propertyNames": {
        "$ref": "#/definitions/Canvas_Ref"
      },
      "additionalProperties": {
        "$ref": "#/definitions/Canvas_Revision"
      },
      "x-typeName": "EngineRevisions",
      "x-meaning": "Opaque revisions the world source reports for what defines its materials. Compared for equality only."
    },
    "Canvas_Revision": {
      "type": "string",
      "minLength": 1,
      "x-typeName": "Revision",
      "x-normalization": "NONE; opaque equality, never numeric ordering"
    },
    "Canvas_MaterialTagMap": {
      "type": "object",
      "propertyNames": {
        "$ref": "#/definitions/Canvas_Ref"
      },
      "additionalProperties": {
        "$ref": "#/definitions/Canvas_MaterialTags"
      },
      "x-typeName": "MaterialTagMap"
    },
    "Canvas_MaterialTags": {
      "type": "object",
      "properties": {
        "passable": {
          "anyOf": [
            {
              "$ref": "#/definitions/Canvas_Bool"
            },
            {
              "type": "null"
            }
          ]
        },
        "liquid": {
          "anyOf": [
            {
              "$ref": "#/definitions/Canvas_Bool"
            },
            {
              "type": "null"
            }
          ]
        },
        "hazardPerSecond": {
          "anyOf": [
            {
              "$ref": "#/definitions/Canvas_NonNegativeFinite"
            },
            {
              "type": "null"
            }
          ]
        },
        "emitsLight": {
          "anyOf": [
            {
              "$ref": "#/definitions/Canvas_Bool"
            },
            {
              "type": "null"
            }
          ]
        },
        "placeable": {
          "anyOf": [
            {
              "$ref": "#/definitions/Canvas_Bool"
            },
            {
              "type": "null"
            }
          ]
        },
        "orientations": {
          "anyOf": [
            {
              "$ref": "#/definitions/Canvas_Orientations"
            },
            {
              "type": "null"
            }
          ]
        },
        "definitionRevision": {
          "anyOf": [
            {
              "$ref": "#/definitions/Canvas_Revision"
            },
            {
              "type": "null"
            }
          ]
        },
        "unknownFields": {
          "$ref": "#/definitions/Canvas_FieldNames"
        },
        "extension": {
          "$ref": "#/definitions/Canvas_OpaqueMap"
        }
      },
      "required": [
        "passable",
        "liquid",
        "hazardPerSecond",
        "emitsLight",
        "placeable",
        "orientations",
        "definitionRevision",
        "unknownFields",
        "extension"
      ],
      "additionalProperties": false,
      "x-meaning": "Neutral tags the world source normalises from its own material definitions. placeable is the world source's conclusion that the material can be written and restored on its declared write path with no side effect and no persistent state; null is unknown and never treated as false or true. Raw engine fields stay in extension and are never read outside the world source.",
      "x-typeName": "MaterialTags"
    },
    "Canvas_Bool": {
      "type": "boolean",
      "x-typeName": "Bool"
    },
    "Canvas_NonNegativeFinite": {
      "type": "number",
      "minimum": 0,
      "x-typeName": "NonNegativeFinite",
      "x-finite": true
    },
    "Canvas_Orientations": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Canvas_Orientation"
      },
      "uniqueItems": true,
      "x-order": "numeric ascending",
      "x-typeName": "Orientations"
    },
    "Canvas_Orientation": {
      "x-typeName": "Orientation",
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "x-meaning": "Neutral orientation index of a material, from the set the Catalogue declares for that material. Conversion to an engine encoding happens only inside the world source."
    },
    "Canvas_FieldNames": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Canvas_Ref"
      },
      "uniqueItems": true,
      "x-typeName": "FieldNames",
      "x-order": "UTF16 ascending"
    },
    "Canvas_OpaqueMap": {
      "x-typeName": "OpaqueMap",
      "type": "object",
      "propertyNames": {
        "$ref": "#/definitions/Canvas_Ref"
      },
      "additionalProperties": {
        "$ref": "#/definitions/Canvas_OpaqueValue"
      }
    },
    "Canvas_OpaqueValue": {
      "x-typeName": "OpaqueValue",
      "x-opaque": true,
      "x-meaning": "Any strict JSON value owned by the world source. Carried and digested unchanged; never interpreted outside the world source."
    },
    "Canvas_Digest": {
      "type": "string",
      "pattern": "^[0-9a-f]{64}$",
      "x-typeName": "Digest"
    },
    "Canvas_MaterialPresentationMap": {
      "x-typeName": "MaterialPresentationMap",
      "type": "object",
      "propertyNames": {
        "$ref": "#/definitions/Canvas_Ref"
      },
      "additionalProperties": {
        "$ref": "#/definitions/Canvas_MaterialPresentation"
      },
      "x-meaning": "materialRef -> presentation."
    },
    "Canvas_MaterialPresentation": {
      "x-typeName": "MaterialPresentation",
      "type": "object",
      "properties": {
        "displayName": {
          "anyOf": [
            {
              "$ref": "#/definitions/Canvas_Text"
            },
            {
              "type": "null"
            }
          ]
        },
        "color": {
          "anyOf": [
            {
              "$ref": "#/definitions/Canvas_SrgbColor"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "displayName",
        "color"
      ],
      "additionalProperties": false,
      "x-meaning": "How the world source names and colours one material for people and for image material matching. null is unknown, never a default name or colour."
    },
    "Canvas_Text": {
      "type": "string",
      "x-typeName": "Text",
      "x-normalization": "NONE"
    },
    "Canvas_SrgbColor": {
      "x-typeName": "SrgbColor",
      "type": "string",
      "pattern": "^#[0-9a-f]{6}$",
      "x-meaning": "An sRGB colour as lower-case #rrggbb. The world source decides how it is obtained (declared, or from its own assets); consumers compare and match colours only."
    },
    "Canvas_OrientationIndex": {
      "x-typeName": "OrientationIndex",
      "type": "array",
      "items": {
        "$ref": "#/definitions/Canvas_OrientationDescriptor"
      },
      "x-uniqueBy": "orientation",
      "x-order": "orientation numeric ascending"
    },
    "Canvas_OrientationDescriptor": {
      "x-typeName": "OrientationDescriptor",
      "type": "object",
      "properties": {
        "orientation": {
          "$ref": "#/definitions/Canvas_Orientation"
        },
        "quarterTurnsAboutUp": {
          "anyOf": [
            {
              "$ref": "#/definitions/Canvas_QuarterTurns"
            },
            {
              "type": "null"
            }
          ]
        },
        "upsideDown": {
          "anyOf": [
            {
              "$ref": "#/definitions/Canvas_Bool"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "orientation",
        "quarterTurnsAboutUp",
        "upsideDown"
      ],
      "additionalProperties": false,
      "x-meaning": "Neutral meaning of one orientation index: clockwise quarter turns about the Frame up axis seen from above, and whether the material is flipped upside down. null means the world source has no neutral expression for that part; the conversion to an engine encoding stays inside the world source."
    },
    "Canvas_QuarterTurns": {
      "x-typeName": "QuarterTurns",
      "type": "integer",
      "minimum": 0,
      "maximum": 3
    },
    "World_MaterialSourcesHostFacts": {
      "type": "object",
      "properties": {
        "provider": {
          "$ref": "#/definitions/World_FactsProviderIdentity"
        },
        "facts": {
          "$ref": "#/definitions/World_MaterialSourceFacts"
        },
        "textures": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/TextureBlob"
          }
        }
      },
      "required": [
        "provider",
        "facts",
        "textures"
      ],
      "additionalProperties": false
    },
    "World_FactsProviderIdentity": {
      "type": "object",
      "properties": {
        "providerRef": {
          "$ref": "#/definitions/World_Ref"
        },
        "providerRevision": {
          "$ref": "#/definitions/World_Ref"
        }
      },
      "required": [
        "providerRef",
        "providerRevision"
      ],
      "additionalProperties": false,
      "x-typeName": "FactsProviderIdentity"
    },
    "World_Ref": {
      "type": "string",
      "minLength": 1,
      "x-typeName": "Ref",
      "x-normalization": "NONE; exact Unicode scalar sequence; never trim/lower/NFC; not a path"
    },
    "World_MaterialSourceFacts": {
      "x-typeName": "MaterialSourceFacts",
      "type": "object",
      "properties": {
        "profileVersion": {
          "const": "material-source-facts/v1"
        },
        "snapshot": {
          "$ref": "#/definitions/World_MaterialSourcesSnapshot"
        },
        "presentation": {
          "$ref": "#/definitions/World_MaterialPresentationMap"
        }
      },
      "required": [
        "profileVersion",
        "snapshot",
        "presentation"
      ],
      "additionalProperties": false,
      "x-meaning": "Material sources and colours for image material selection. presentation has exactly the materialRefs of snapshot.materials as keys. Texture bytes are not on the wire: they are referenced by bytesDigest and travel through the in-process material sources port."
    },
    "World_MaterialSourcesSnapshot": {
      "x-typeName": "MaterialSourcesSnapshot",
      "type": "object",
      "properties": {
        "profileVersion": {
          "const": "material-sources/v2"
        },
        "connection": {
          "$ref": "#/definitions/World_MaterialSourceConnection"
        },
        "catalogueDigest": {
          "$ref": "#/definitions/World_Digest"
        },
        "engineRevisions": {
          "$ref": "#/definitions/World_EngineRevisions"
        },
        "sourceBasis": {
          "const": "WORLD_SOURCE_ASSET_ONLY"
        },
        "materials": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/World_MaterialSource"
          }
        },
        "sourceRevision": {
          "$ref": "#/definitions/World_Digest"
        }
      },
      "required": [
        "profileVersion",
        "connection",
        "catalogueDigest",
        "engineRevisions",
        "sourceBasis",
        "materials",
        "sourceRevision"
      ],
      "additionalProperties": false
    },
    "World_MaterialSourceConnection": {
      "x-typeName": "MaterialSourceConnection",
      "type": "object",
      "properties": {
        "worldRef": {
          "$ref": "#/definitions/World_Ref"
        },
        "connectionRef": {
          "$ref": "#/definitions/World_Ref"
        },
        "connectionIncarnationRef": {
          "$ref": "#/definitions/World_Ref"
        }
      },
      "required": [
        "worldRef",
        "connectionRef",
        "connectionIncarnationRef"
      ],
      "additionalProperties": false
    },
    "World_Digest": {
      "type": "string",
      "pattern": "^[0-9a-f]{64}$",
      "x-typeName": "Digest"
    },
    "World_EngineRevisions": {
      "type": "object",
      "propertyNames": {
        "$ref": "#/definitions/World_Ref"
      },
      "additionalProperties": {
        "$ref": "#/definitions/World_Revision"
      },
      "x-typeName": "EngineRevisions",
      "x-meaning": "Opaque revisions the world source reports for what defines its materials. Compared for equality only."
    },
    "World_Revision": {
      "type": "string",
      "minLength": 1,
      "x-typeName": "Revision",
      "x-normalization": "NONE; opaque equality, never numeric ordering"
    },
    "World_MaterialSource": {
      "x-typeName": "MaterialSource",
      "oneOf": [
        {
          "$ref": "#/definitions/World_KnownMaterialSource"
        },
        {
          "$ref": "#/definitions/World_UnknownMaterialSource"
        }
      ],
      "x-discriminator": "availability",
      "x-variantKeys": [
        "KNOWN",
        "UNKNOWN"
      ]
    },
    "World_KnownMaterialSource": {
      "x-typeName": "KnownMaterialSource",
      "type": "object",
      "properties": {
        "availability": {
          "const": "KNOWN"
        },
        "materialRef": {
          "$ref": "#/definitions/World_Ref"
        },
        "orientation": {
          "$ref": "#/definitions/World_Orientation"
        },
        "definitionRevision": {
          "$ref": "#/definitions/World_Revision"
        },
        "texture": {
          "$ref": "#/definitions/World_MaterialTextureSource"
        }
      },
      "required": [
        "availability",
        "materialRef",
        "orientation",
        "definitionRevision",
        "texture"
      ],
      "additionalProperties": false
    },
    "World_Orientation": {
      "x-typeName": "Orientation",
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "x-meaning": "Neutral orientation index of a material, from the set the Catalogue declares for that material. Conversion to an engine encoding happens only inside the world source."
    },
    "World_MaterialTextureSource": {
      "x-typeName": "MaterialTextureSource",
      "type": "object",
      "properties": {
        "textureName": {
          "$ref": "#/definitions/World_Ref"
        },
        "sourceKind": {
          "enum": [
            "GAME",
            "MOD"
          ]
        },
        "sourceRef": {
          "$ref": "#/definitions/World_Ref"
        },
        "interpretation": {
          "const": "SIMPLE_UNIFORM_NODE_TILES"
        },
        "mediaType": {
          "enum": [
            "image/png",
            "image/jpeg",
            "image/webp"
          ]
        },
        "bytesDigest": {
          "$ref": "#/definitions/World_Digest"
        },
        "byteLength": {
          "$ref": "#/definitions/World_PositiveInt"
        }
      },
      "required": [
        "textureName",
        "sourceKind",
        "sourceRef",
        "interpretation",
        "mediaType",
        "bytesDigest",
        "byteLength"
      ],
      "additionalProperties": false
    },
    "World_PositiveInt": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "x-typeName": "PositiveInt"
    },
    "World_UnknownMaterialSource": {
      "x-typeName": "UnknownMaterialSource",
      "type": "object",
      "properties": {
        "availability": {
          "const": "UNKNOWN"
        },
        "materialRef": {
          "$ref": "#/definitions/World_Ref"
        },
        "orientation": {
          "anyOf": [
            {
              "$ref": "#/definitions/World_Orientation"
            },
            {
              "type": "null"
            }
          ]
        },
        "definitionRevision": {
          "anyOf": [
            {
              "$ref": "#/definitions/World_Revision"
            },
            {
              "type": "null"
            }
          ]
        },
        "texture": {
          "type": "null"
        },
        "reason": {
          "$ref": "#/definitions/World_MaterialSourceUnknownReason"
        }
      },
      "required": [
        "availability",
        "materialRef",
        "orientation",
        "definitionRevision",
        "texture",
        "reason"
      ],
      "additionalProperties": false
    },
    "World_MaterialSourceUnknownReason": {
      "x-typeName": "MaterialSourceUnknownReason",
      "enum": [
        "UNKNOWN_ORIENTATION",
        "UNKNOWN_DEFINITION",
        "MISSING_TEXTURE",
        "UNRESOLVED_SOURCE",
        "UNSUPPORTED_APPEARANCE"
      ]
    },
    "World_MaterialPresentationMap": {
      "x-typeName": "MaterialPresentationMap",
      "type": "object",
      "propertyNames": {
        "$ref": "#/definitions/World_Ref"
      },
      "additionalProperties": {
        "$ref": "#/definitions/World_MaterialPresentation"
      },
      "x-meaning": "materialRef -> presentation."
    },
    "World_MaterialPresentation": {
      "x-typeName": "MaterialPresentation",
      "type": "object",
      "properties": {
        "displayName": {
          "anyOf": [
            {
              "$ref": "#/definitions/World_Text"
            },
            {
              "type": "null"
            }
          ]
        },
        "color": {
          "anyOf": [
            {
              "$ref": "#/definitions/World_SrgbColor"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "displayName",
        "color"
      ],
      "additionalProperties": false,
      "x-meaning": "How the world source names and colours one material for people and for image material matching. null is unknown, never a default name or colour."
    },
    "World_Text": {
      "type": "string",
      "x-typeName": "Text",
      "x-normalization": "NONE"
    },
    "World_SrgbColor": {
      "x-typeName": "SrgbColor",
      "type": "string",
      "pattern": "^#[0-9a-f]{6}$",
      "x-meaning": "An sRGB colour as lower-case #rrggbb. The world source decides how it is obtained (declared, or from its own assets); consumers compare and match colours only."
    },
    "TextureBlob": {
      "type": "object",
      "properties": {
        "bytesDigest": {
          "$ref": "#/definitions/Digest"
        },
        "bytes": {
          "$ref": "#/definitions/Bytes"
        }
      },
      "required": [
        "bytesDigest",
        "bytes"
      ],
      "additionalProperties": false
    },
    "ImageMaterialInput": {
      "type": "object",
      "properties": {
        "imageBytes": {
          "$ref": "#/definitions/Bytes"
        },
        "catalogue": {
          "$ref": "#/definitions/Catalogue"
        },
        "currentConnection": {
          "$ref": "#/definitions/MaterialSourceConnection"
        },
        "materialSources": {
          "$ref": "#/definitions/MaterialSourcesInput"
        }
      },
      "required": [
        "imageBytes",
        "catalogue",
        "currentConnection",
        "materialSources"
      ],
      "additionalProperties": false
    },
    "Catalogue": {
      "type": "object",
      "properties": {
        "profileVersion": {
          "const": "catalogue/v3"
        },
        "engineRevisions": {
          "$ref": "#/definitions/EngineRevisions"
        },
        "emptyMaterialRef": {
          "$ref": "#/definitions/Ref"
        },
        "materials": {
          "$ref": "#/definitions/MaterialTagMap"
        }
      },
      "required": [
        "profileVersion",
        "engineRevisions",
        "emptyMaterialRef",
        "materials"
      ],
      "additionalProperties": false,
      "x-typeName": "Catalogue",
      "x-meaning": "The world source's own material vocabulary. emptyMaterialRef names the material that means an empty cell; it must be a key of materials."
    },
    "EngineRevisions": {
      "type": "object",
      "propertyNames": {
        "$ref": "#/definitions/Ref"
      },
      "additionalProperties": {
        "$ref": "#/definitions/Revision"
      },
      "x-typeName": "EngineRevisions",
      "x-meaning": "Opaque revisions the world source reports for what defines its materials. Compared for equality only."
    },
    "Revision": {
      "type": "string",
      "minLength": 1,
      "x-typeName": "Revision",
      "x-normalization": "NONE; opaque equality, never numeric ordering"
    },
    "MaterialTagMap": {
      "type": "object",
      "propertyNames": {
        "$ref": "#/definitions/Ref"
      },
      "additionalProperties": {
        "$ref": "#/definitions/MaterialTags"
      },
      "x-typeName": "MaterialTagMap"
    },
    "MaterialTags": {
      "type": "object",
      "properties": {
        "passable": {
          "anyOf": [
            {
              "$ref": "#/definitions/Bool"
            },
            {
              "type": "null"
            }
          ]
        },
        "liquid": {
          "anyOf": [
            {
              "$ref": "#/definitions/Bool"
            },
            {
              "type": "null"
            }
          ]
        },
        "hazardPerSecond": {
          "anyOf": [
            {
              "$ref": "#/definitions/NonNegativeFinite"
            },
            {
              "type": "null"
            }
          ]
        },
        "emitsLight": {
          "anyOf": [
            {
              "$ref": "#/definitions/Bool"
            },
            {
              "type": "null"
            }
          ]
        },
        "placeable": {
          "anyOf": [
            {
              "$ref": "#/definitions/Bool"
            },
            {
              "type": "null"
            }
          ]
        },
        "orientations": {
          "anyOf": [
            {
              "$ref": "#/definitions/Orientations"
            },
            {
              "type": "null"
            }
          ]
        },
        "definitionRevision": {
          "anyOf": [
            {
              "$ref": "#/definitions/Revision"
            },
            {
              "type": "null"
            }
          ]
        },
        "unknownFields": {
          "$ref": "#/definitions/FieldNames"
        },
        "extension": {
          "$ref": "#/definitions/OpaqueMap"
        }
      },
      "required": [
        "passable",
        "liquid",
        "hazardPerSecond",
        "emitsLight",
        "placeable",
        "orientations",
        "definitionRevision",
        "unknownFields",
        "extension"
      ],
      "additionalProperties": false,
      "x-meaning": "Neutral tags the world source normalises from its own material definitions. placeable is the world source's conclusion that the material can be written and restored on its declared write path with no side effect and no persistent state; null is unknown and never treated as false or true. Raw engine fields stay in extension and are never read outside the world source.",
      "x-typeName": "MaterialTags"
    },
    "Bool": {
      "type": "boolean",
      "x-typeName": "Bool"
    },
    "NonNegativeFinite": {
      "type": "number",
      "minimum": 0,
      "x-typeName": "NonNegativeFinite",
      "x-finite": true
    },
    "Orientations": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Orientation"
      },
      "uniqueItems": true,
      "x-order": "numeric ascending",
      "x-typeName": "Orientations"
    },
    "Orientation": {
      "x-typeName": "Orientation",
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "x-meaning": "Neutral orientation index of a material, from the set the Catalogue declares for that material. Conversion to an engine encoding happens only inside the world source."
    },
    "FieldNames": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Ref"
      },
      "uniqueItems": true,
      "x-typeName": "FieldNames",
      "x-order": "UTF16 ascending"
    },
    "OpaqueMap": {
      "x-typeName": "OpaqueMap",
      "type": "object",
      "propertyNames": {
        "$ref": "#/definitions/Ref"
      },
      "additionalProperties": {
        "$ref": "#/definitions/OpaqueValue"
      }
    },
    "OpaqueValue": {
      "x-typeName": "OpaqueValue",
      "x-opaque": true,
      "x-meaning": "Any strict JSON value owned by the world source. Carried and digested unchanged; never interpreted outside the world source."
    },
    "MaterialSourceConnection": {
      "x-typeName": "MaterialSourceConnection",
      "type": "object",
      "properties": {
        "worldRef": {
          "$ref": "#/definitions/Ref"
        },
        "connectionRef": {
          "$ref": "#/definitions/Ref"
        },
        "connectionIncarnationRef": {
          "$ref": "#/definitions/Ref"
        }
      },
      "required": [
        "worldRef",
        "connectionRef",
        "connectionIncarnationRef"
      ],
      "additionalProperties": false
    },
    "MaterialSourcesInput": {
      "type": "object",
      "properties": {
        "snapshot": {
          "$ref": "#/definitions/MaterialSourcesSnapshot"
        },
        "textures": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/TextureBlob"
          }
        }
      },
      "required": [
        "snapshot",
        "textures"
      ],
      "additionalProperties": false
    },
    "MaterialSourcesSnapshot": {
      "x-typeName": "MaterialSourcesSnapshot",
      "type": "object",
      "properties": {
        "profileVersion": {
          "const": "material-sources/v2"
        },
        "connection": {
          "$ref": "#/definitions/MaterialSourceConnection"
        },
        "catalogueDigest": {
          "$ref": "#/definitions/Digest"
        },
        "engineRevisions": {
          "$ref": "#/definitions/EngineRevisions"
        },
        "sourceBasis": {
          "const": "WORLD_SOURCE_ASSET_ONLY"
        },
        "materials": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/MaterialSource"
          }
        },
        "sourceRevision": {
          "$ref": "#/definitions/Digest"
        }
      },
      "required": [
        "profileVersion",
        "connection",
        "catalogueDigest",
        "engineRevisions",
        "sourceBasis",
        "materials",
        "sourceRevision"
      ],
      "additionalProperties": false
    },
    "MaterialSource": {
      "x-typeName": "MaterialSource",
      "oneOf": [
        {
          "$ref": "#/definitions/KnownMaterialSource"
        },
        {
          "$ref": "#/definitions/UnknownMaterialSource"
        }
      ],
      "x-discriminator": "availability",
      "x-variantKeys": [
        "KNOWN",
        "UNKNOWN"
      ]
    },
    "KnownMaterialSource": {
      "x-typeName": "KnownMaterialSource",
      "type": "object",
      "properties": {
        "availability": {
          "const": "KNOWN"
        },
        "materialRef": {
          "$ref": "#/definitions/Ref"
        },
        "orientation": {
          "$ref": "#/definitions/Orientation"
        },
        "definitionRevision": {
          "$ref": "#/definitions/Revision"
        },
        "texture": {
          "$ref": "#/definitions/MaterialTextureSource"
        }
      },
      "required": [
        "availability",
        "materialRef",
        "orientation",
        "definitionRevision",
        "texture"
      ],
      "additionalProperties": false
    },
    "MaterialTextureSource": {
      "x-typeName": "MaterialTextureSource",
      "type": "object",
      "properties": {
        "textureName": {
          "$ref": "#/definitions/Ref"
        },
        "sourceKind": {
          "enum": [
            "GAME",
            "MOD"
          ]
        },
        "sourceRef": {
          "$ref": "#/definitions/Ref"
        },
        "interpretation": {
          "const": "SIMPLE_UNIFORM_NODE_TILES"
        },
        "mediaType": {
          "enum": [
            "image/png",
            "image/jpeg",
            "image/webp"
          ]
        },
        "bytesDigest": {
          "$ref": "#/definitions/Digest"
        },
        "byteLength": {
          "$ref": "#/definitions/PositiveInt"
        }
      },
      "required": [
        "textureName",
        "sourceKind",
        "sourceRef",
        "interpretation",
        "mediaType",
        "bytesDigest",
        "byteLength"
      ],
      "additionalProperties": false
    },
    "UnknownMaterialSource": {
      "x-typeName": "UnknownMaterialSource",
      "type": "object",
      "properties": {
        "availability": {
          "const": "UNKNOWN"
        },
        "materialRef": {
          "$ref": "#/definitions/Ref"
        },
        "orientation": {
          "anyOf": [
            {
              "$ref": "#/definitions/Orientation"
            },
            {
              "type": "null"
            }
          ]
        },
        "definitionRevision": {
          "anyOf": [
            {
              "$ref": "#/definitions/Revision"
            },
            {
              "type": "null"
            }
          ]
        },
        "texture": {
          "type": "null"
        },
        "reason": {
          "$ref": "#/definitions/MaterialSourceUnknownReason"
        }
      },
      "required": [
        "availability",
        "materialRef",
        "orientation",
        "definitionRevision",
        "texture",
        "reason"
      ],
      "additionalProperties": false
    },
    "MaterialSourceUnknownReason": {
      "x-typeName": "MaterialSourceUnknownReason",
      "enum": [
        "UNKNOWN_ORIENTATION",
        "UNKNOWN_DEFINITION",
        "MISSING_TEXTURE",
        "UNRESOLVED_SOURCE",
        "UNSUPPORTED_APPEARANCE"
      ]
    },
    "ImageMaterialResult": {
      "type": "object",
      "properties": {
        "image": {
          "$ref": "#/definitions/ImageInfo"
        },
        "dominant": {
          "type": "object",
          "properties": {
            "rgb": {
              "$ref": "#/definitions/RGB"
            },
            "lab": {
              "$ref": "#/definitions/Lab"
            },
            "alphaWeight": {
              "$ref": "#/definitions/PositiveFinite"
            },
            "bin": {
              "type": "integer",
              "minimum": 0,
              "maximum": 4095
            }
          },
          "required": [
            "rgb",
            "lab",
            "alphaWeight",
            "bin"
          ],
          "additionalProperties": false
        },
        "material": {
          "$ref": "#/definitions/MaterialSpec"
        },
        "match": {
          "type": "object",
          "properties": {
            "rgb": {
              "$ref": "#/definitions/RGB"
            },
            "lab": {
              "$ref": "#/definitions/Lab"
            },
            "distance": {
              "$ref": "#/definitions/NonNegativeFinite"
            },
            "algorithm": {
              "const": "CIEDE2000"
            },
            "texture": {
              "$ref": "#/definitions/MaterialTextureSource"
            }
          },
          "required": [
            "rgb",
            "lab",
            "distance",
            "algorithm",
            "texture"
          ],
          "additionalProperties": false
        },
        "sourceRevision": {
          "$ref": "#/definitions/Digest"
        },
        "catalogueDigest": {
          "$ref": "#/definitions/Digest"
        },
        "connection": {
          "$ref": "#/definitions/MaterialSourceConnection"
        },
        "engineRevisions": {
          "$ref": "#/definitions/EngineRevisions"
        },
        "sourceBasis": {
          "const": "WORLD_SOURCE_ASSET_ONLY"
        },
        "sources": {
          "type": "object",
          "properties": {
            "unknownVariants": {
              "$ref": "#/definitions/NonNegativeInt"
            },
            "staticIneligibleVariants": {
              "$ref": "#/definitions/NonNegativeInt"
            },
            "measuredLegalVariants": {
              "$ref": "#/definitions/NonNegativeInt"
            },
            "measuredTextures": {
              "$ref": "#/definitions/NonNegativeInt"
            }
          },
          "required": [
            "unknownVariants",
            "staticIneligibleVariants",
            "measuredLegalVariants",
            "measuredTextures"
          ],
          "additionalProperties": false
        },
        "modelCalls": {
          "const": 0
        },
        "worldWrites": {
          "const": 0
        }
      },
      "required": [
        "image",
        "dominant",
        "material",
        "match",
        "sourceRevision",
        "catalogueDigest",
        "connection",
        "engineRevisions",
        "sourceBasis",
        "sources",
        "modelCalls",
        "worldWrites"
      ],
      "additionalProperties": false
    },
    "ImageInfo": {
      "type": "object",
      "properties": {
        "sha256": {
          "$ref": "#/definitions/Digest"
        },
        "format": {
          "enum": [
            "png",
            "jpeg",
            "webp"
          ]
        },
        "width": {
          "$ref": "#/definitions/PositiveInt"
        },
        "height": {
          "$ref": "#/definitions/PositiveInt"
        },
        "pixels": {
          "$ref": "#/definitions/PositiveInt"
        }
      },
      "required": [
        "sha256",
        "format",
        "width",
        "height",
        "pixels"
      ],
      "additionalProperties": false
    },
    "RGB": {
      "type": "array",
      "items": {
        "type": "integer",
        "minimum": 0,
        "maximum": 255
      },
      "minItems": 3,
      "maxItems": 3
    },
    "Lab": {
      "type": "object",
      "properties": {
        "L": {
          "type": "number",
          "x-finite": true
        },
        "a": {
          "type": "number",
          "x-finite": true
        },
        "b": {
          "type": "number",
          "x-finite": true
        }
      },
      "required": [
        "L",
        "a",
        "b"
      ],
      "additionalProperties": false
    },
    "PositiveFinite": {
      "type": "number",
      "exclusiveMinimum": 0,
      "x-typeName": "PositiveFinite",
      "x-finite": true
    },
    "MaterialSpec": {
      "type": "object",
      "properties": {
        "materialRef": {
          "$ref": "#/definitions/Ref"
        },
        "orientation": {
          "$ref": "#/definitions/Orientation"
        }
      },
      "required": [
        "materialRef",
        "orientation"
      ],
      "additionalProperties": false,
      "x-typeName": "MaterialSpec"
    },
    "NonNegativeInt": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "x-typeName": "NonNegativeInt"
    }
  },
  "parameters": {
    "type": "object",
    "properties": {
      "attachmentRef": {
        "type": "string"
      }
    },
    "required": [
      "attachmentRef"
    ],
    "additionalProperties": false
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "image": {
        "type": "object",
        "properties": {
          "sha256": {
            "type": "string"
          },
          "format": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "width": {
            "type": "integer"
          },
          "height": {
            "type": "integer"
          },
          "pixels": {
            "type": "integer"
          }
        },
        "required": [
          "sha256",
          "format",
          "width",
          "height",
          "pixels"
        ],
        "additionalProperties": false
      },
      "dominant": {
        "type": "object",
        "properties": {
          "rgb": {
            "type": "array",
            "items": {
              "type": "integer"
            }
          },
          "lab": {
            "type": "object",
            "properties": {
              "L": {
                "type": "number"
              },
              "a": {
                "type": "number"
              },
              "b": {
                "type": "number"
              }
            },
            "required": [
              "L",
              "a",
              "b"
            ],
            "additionalProperties": false
          },
          "alphaWeight": {
            "type": "number"
          },
          "bin": {
            "type": "integer"
          }
        },
        "required": [
          "rgb",
          "lab",
          "alphaWeight",
          "bin"
        ],
        "additionalProperties": false
      },
      "material": {
        "type": "object",
        "properties": {
          "materialRef": {
            "type": "string"
          },
          "orientation": {
            "type": "integer"
          }
        },
        "required": [
          "materialRef",
          "orientation"
        ],
        "additionalProperties": false
      },
      "match": {
        "type": "object",
        "properties": {
          "rgb": {
            "type": "array",
            "items": {
              "type": "integer"
            }
          },
          "lab": {
            "type": "object",
            "properties": {
              "L": {
                "type": "number"
              },
              "a": {
                "type": "number"
              },
              "b": {
                "type": "number"
              }
            },
            "required": [
              "L",
              "a",
              "b"
            ],
            "additionalProperties": false
          },
          "distance": {
            "type": "number"
          },
          "algorithm": {
            "const": "CIEDE2000",
            "type": "string"
          },
          "texture": {
            "type": "object",
            "properties": {
              "textureName": {
                "type": "string"
              },
              "sourceKind": {
                "enum": [
                  "GAME",
                  "MOD"
                ],
                "type": "string"
              },
              "sourceRef": {
                "type": "string"
              },
              "interpretation": {
                "const": "SIMPLE_UNIFORM_NODE_TILES",
                "type": "string"
              },
              "mediaType": {
                "enum": [
                  "image/png",
                  "image/jpeg",
                  "image/webp"
                ],
                "type": "string"
              },
              "bytesDigest": {
                "type": "string"
              },
              "byteLength": {
                "type": "integer"
              }
            },
            "required": [
              "textureName",
              "sourceKind",
              "sourceRef",
              "interpretation",
              "mediaType",
              "bytesDigest",
              "byteLength"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "rgb",
          "lab",
          "distance",
          "algorithm",
          "texture"
        ],
        "additionalProperties": false
      },
      "sourceRevision": {
        "type": "string"
      },
      "catalogueDigest": {
        "type": "string"
      },
      "connection": {
        "type": "object",
        "properties": {
          "worldRef": {
            "type": "string"
          },
          "connectionRef": {
            "type": "string"
          },
          "connectionIncarnationRef": {
            "type": "string"
          }
        },
        "required": [
          "worldRef",
          "connectionRef",
          "connectionIncarnationRef"
        ],
        "additionalProperties": false
      },
      "engineRevisions": {
        "type": "object",
        "additionalProperties": true
      },
      "sourceBasis": {
        "const": "WORLD_SOURCE_ASSET_ONLY",
        "type": "string"
      },
      "sources": {
        "type": "object",
        "properties": {
          "unknownVariants": {
            "type": "integer"
          },
          "staticIneligibleVariants": {
            "type": "integer"
          },
          "measuredLegalVariants": {
            "type": "integer"
          },
          "measuredTextures": {
            "type": "integer"
          }
        },
        "required": [
          "unknownVariants",
          "staticIneligibleVariants",
          "measuredLegalVariants",
          "measuredTextures"
        ],
        "additionalProperties": false
      },
      "modelCalls": {
        "const": 0,
        "type": "integer"
      },
      "worldWrites": {
        "const": 0,
        "type": "integer"
      }
    },
    "required": [
      "image",
      "dominant",
      "material",
      "match",
      "sourceRevision",
      "catalogueDigest",
      "connection",
      "engineRevisions",
      "sourceBasis",
      "sources",
      "modelCalls",
      "worldWrites"
    ],
    "additionalProperties": false
  },
  "documentSHA256": "6520e6b96684ab0b58119302e5410693b5cb227e581c5e9afc180fd20fc799fd"
};
