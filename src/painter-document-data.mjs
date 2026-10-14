// Owned C-painter v3 projection compiled from the approved D153 document.
export default {
  "definitions": {
    "AssembleInput": {
      "type": "object",
      "properties": {
        "request": {
          "$ref": "#/definitions/ValidateBuildProposalRequest"
        },
        "geometry": {
          "$ref": "#/definitions/Geometry"
        },
        "documentId": {
          "$ref": "#/definitions/Ref"
        },
        "trusted": {
          "$ref": "#/definitions/Trusted"
        },
        "entrances": {
          "$ref": "#/definitions/Entrances"
        }
      },
      "required": [
        "request",
        "geometry",
        "documentId",
        "trusted"
      ],
      "additionalProperties": false
    },
    "Assembled": {
      "type": "object",
      "properties": {
        "build": {
          "$ref": "#/definitions/BuildProjection"
        },
        "buildDigest": {
          "$ref": "#/definitions/Digest"
        },
        "finalEffects": {
          "$ref": "#/definitions/FinalEffects"
        }
      },
      "required": [
        "build",
        "buildDigest",
        "finalEffects"
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
    "Axes": {
      "type": "array",
      "items": [
        {
          "$ref": "#/definitions/Axis"
        },
        {
          "$ref": "#/definitions/Axis"
        },
        {
          "$ref": "#/definitions/Axis"
        }
      ],
      "minItems": 3,
      "maxItems": 3,
      "additionalItems": false,
      "x-typeName": "Axes",
      "x-order": "source X,Y,Z"
    },
    "Axis": {
      "enum": [
        "+X",
        "+Y",
        "+Z",
        "-X",
        "-Y",
        "-Z"
      ],
      "x-typeName": "Axis"
    },
    "BodyWitness": {
      "type": "object",
      "properties": {
        "evidence": {
          "$ref": "#/definitions/EvidenceBinding"
        },
        "positions": {
          "$ref": "#/definitions/Positions"
        }
      },
      "required": [
        "evidence",
        "positions"
      ],
      "additionalProperties": false,
      "x-typeName": "BodyWitness"
    },
    "Bool": {
      "type": "boolean",
      "x-typeName": "Bool"
    },
    "BoundRules": {
      "type": "object",
      "properties": {
        "requireEntrance": {
          "$ref": "#/definitions/Bool"
        },
        "clearance": {
          "anyOf": [
            {
              "$ref": "#/definitions/ClearanceCells"
            },
            {
              "type": "null"
            }
          ]
        },
        "portalRefs": {
          "$ref": "#/definitions/OrderedRefs"
        },
        "hazardPolicy": {
          "$ref": "#/definitions/HazardPolicy"
        }
      },
      "required": [
        "requireEntrance",
        "clearance",
        "portalRefs",
        "hazardPolicy"
      ],
      "additionalProperties": false
    },
    "Box": {
      "type": "object",
      "properties": {
        "min": {
          "$ref": "#/definitions/Position"
        },
        "max": {
          "$ref": "#/definitions/Position"
        }
      },
      "required": [
        "min",
        "max"
      ],
      "additionalProperties": false,
      "x-typeName": "Box"
    },
    "BriefProjection": {
      "oneOf": [
        {
          "$ref": "#/definitions/BriefProjectionV5"
        },
        {
          "$ref": "#/definitions/BriefProjectionV6"
        }
      ],
      "x-typeName": "BriefProjection"
    },
    "BuildDimensions": {
      "type": "object",
      "properties": {
        "width": {
          "$ref": "#/definitions/PositiveFinite"
        },
        "height": {
          "$ref": "#/definitions/PositiveFinite"
        },
        "depth": {
          "$ref": "#/definitions/PositiveFinite"
        },
        "unit": {
          "$ref": "#/definitions/Ref"
        }
      },
      "required": [
        "width",
        "height",
        "depth",
        "unit"
      ],
      "additionalProperties": false,
      "x-typeName": "BuildDimensions",
      "description": "Building size in whole nodes chosen by the player. Not a player or avatar size."
    },
    "BuildEntryReplay": {
      "enum": [
        "NEW",
        "EXACT_REPLAY",
        "CONFLICT"
      ],
      "x-typeName": "BuildEntryReplay"
    },
    "BuildMessages": {
      "type": "object",
      "properties": {
        "system": {
          "type": "string",
          "minLength": 1
        },
        "messages": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "role": {
                "const": "user"
              },
              "content": {
                "type": "array",
                "items": {
                  "$ref": "#/definitions/ContentHint"
                },
                "minItems": 1
              }
            },
            "required": [
              "role",
              "content"
            ],
            "additionalProperties": false
          },
          "minItems": 1,
          "maxItems": 1
        }
      },
      "required": [
        "system",
        "messages"
      ],
      "additionalProperties": false
    },
    "BuildOps": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/SetBox"
      },
      "minItems": 1,
      "x-typeName": "BuildOps",
      "x-order": "input; last writer wins"
    },
    "BuildPlan": {
      "type": "object",
      "properties": {
        "invocationId": {
          "$ref": "#/definitions/Ref"
        },
        "build": {
          "$ref": "#/definitions/BuildProjection"
        },
        "buildDigest": {
          "$ref": "#/definitions/Digest"
        }
      },
      "required": [
        "invocationId",
        "build",
        "buildDigest"
      ],
      "additionalProperties": false,
      "x-typeName": "BuildPlan"
    },
    "BuildProjection": {
      "type": "object",
      "properties": {
        "contractVersion": {
          "const": "BUILD/V5"
        },
        "geometryProfile": {
          "$ref": "#/definitions/GeometryProfile"
        },
        "documentId": {
          "$ref": "#/definitions/Ref"
        },
        "coordinateFrame": {
          "$ref": "#/definitions/Frame"
        },
        "catalogueDigest": {
          "$ref": "#/definitions/Digest"
        },
        "targetFactsDigest": {
          "$ref": "#/definitions/Digest"
        },
        "safetyProfileDigest": {
          "$ref": "#/definitions/Digest"
        },
        "materials": {
          "$ref": "#/definitions/MaterialMap"
        },
        "operations": {
          "$ref": "#/definitions/BuildOps"
        },
        "declaredBounds": {
          "$ref": "#/definitions/Box"
        },
        "witnesses": {
          "$ref": "#/definitions/Witnesses"
        }
      },
      "required": [
        "contractVersion",
        "geometryProfile",
        "documentId",
        "coordinateFrame",
        "catalogueDigest",
        "targetFactsDigest",
        "safetyProfileDigest",
        "materials",
        "operations",
        "declaredBounds",
        "witnesses"
      ],
      "additionalProperties": false,
      "x-typeName": "BuildProjection"
    },
    "BuildProposal": {
      "type": "object",
      "properties": {
        "decision": {
          "const": "BUILD"
        },
        "materials": {
          "$ref": "#/definitions/MaterialMap"
        },
        "boxes": {
          "$ref": "#/definitions/BuildProposalBoxes"
        }
      },
      "required": [
        "decision",
        "materials",
        "boxes"
      ],
      "additionalProperties": false,
      "x-typeName": "BuildProposal"
    },
    "BuildProposalBox": {
      "type": "object",
      "properties": {
        "min": {
          "$ref": "#/definitions/Position"
        },
        "max": {
          "$ref": "#/definitions/Position"
        },
        "materialRef": {
          "$ref": "#/definitions/Ref"
        }
      },
      "required": [
        "min",
        "max",
        "materialRef"
      ],
      "additionalProperties": false,
      "x-typeName": "BuildProposalBox"
    },
    "BuildProposalBoxes": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/BuildProposalBox"
      },
      "minItems": 1,
      "x-typeName": "BuildProposalBoxes",
      "x-order": "input; last writer wins"
    },
    "BuildProposalContext": {
      "oneOf": [
        {
          "$ref": "#/definitions/BuildProposalContextV5"
        },
        {
          "$ref": "#/definitions/BuildProposalContextV6"
        }
      ],
      "x-typeName": "BuildProposalContext"
    },
    "BuildProposalProviderFacts": {
      "oneOf": [
        {
          "$ref": "#/definitions/BuildProposalProviderFactsV5"
        },
        {
          "$ref": "#/definitions/BuildProposalProviderFactsV6"
        }
      ],
      "x-typeName": "BuildProposalProviderFacts"
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
    "ClearanceCells": {
      "type": "object",
      "properties": {
        "width": {
          "$ref": "#/definitions/PositiveInt"
        },
        "height": {
          "$ref": "#/definitions/PositiveInt"
        },
        "depth": {
          "$ref": "#/definitions/PositiveInt"
        },
        "unit": {
          "const": "node"
        }
      },
      "required": [
        "width",
        "height",
        "depth",
        "unit"
      ],
      "additionalProperties": false,
      "x-typeName": "ClearanceCells",
      "description": "Building design clearance proposed by the skill and confirmed by the player. Not a measured, templated or derived player size; it does not prove that a real player fits."
    },
    "Colour": {
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
        }
      },
      "required": [
        "rgb",
        "lab",
        "alphaWeight"
      ],
      "additionalProperties": false
    },
    "ConfigInput": {
      "type": "object",
      "properties": {
        "maxBytes": {
          "$ref": "#/definitions/PositiveInt"
        },
        "maxPixels": {
          "$ref": "#/definitions/PositiveInt"
        },
        "formats": {
          "type": "array",
          "items": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ]
          },
          "minItems": 1,
          "maxItems": 3,
          "uniqueItems": true
        }
      },
      "required": [],
      "additionalProperties": false
    },
    "ConfirmedIntent": {
      "type": "object",
      "properties": {
        "kind": {
          "$ref": "#/definitions/IntentKind"
        },
        "text": {
          "$ref": "#/definitions/Text"
        },
        "purpose": {
          "anyOf": [
            {
              "$ref": "#/definitions/Text"
            },
            {
              "type": "null"
            }
          ]
        },
        "dimensions": {
          "anyOf": [
            {
              "$ref": "#/definitions/BuildDimensions"
            },
            {
              "type": "null"
            }
          ]
        },
        "entrancePortalRefs": {
          "$ref": "#/definitions/OrderedRefs"
        },
        "confirmedTurnRevision": {
          "$ref": "#/definitions/Revision"
        },
        "siteRules": {
          "$ref": "#/definitions/SiteRules"
        },
        "placement": {
          "$ref": "#/definitions/PlacementProposal"
        }
      },
      "required": [
        "kind",
        "text",
        "purpose",
        "dimensions",
        "entrancePortalRefs",
        "confirmedTurnRevision",
        "siteRules"
      ],
      "additionalProperties": false,
      "x-typeName": "ConfirmedIntent"
    },
    "ContentHint": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "type": {
              "const": "text"
            },
            "text": {
              "type": "string",
              "minLength": 1
            }
          },
          "required": [
            "type",
            "text"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "type": {
              "const": "image"
            },
            "attachment": {
              "$ref": "#/definitions/AttachmentHint"
            }
          },
          "required": [
            "type",
            "attachment"
          ],
          "additionalProperties": false
        }
      ]
    },
    "Controls": {
      "type": "object",
      "properties": {
        "purpose": {
          "anyOf": [
            {
              "$ref": "#/definitions/Text"
            },
            {
              "type": "null"
            }
          ]
        },
        "dimensions": {
          "anyOf": [
            {
              "$ref": "#/definitions/BuildDimensions"
            },
            {
              "type": "null"
            }
          ]
        },
        "entrancePortalRefs": {
          "$ref": "#/definitions/OrderedRefs"
        },
        "styleText": {
          "anyOf": [
            {
              "$ref": "#/definitions/Text"
            },
            {
              "type": "null"
            }
          ]
        },
        "siteRules": {
          "anyOf": [
            {
              "$ref": "#/definitions/SiteRules"
            },
            {
              "type": "null"
            }
          ]
        },
        "placement": {
          "$ref": "#/definitions/PlacementProposal"
        }
      },
      "required": [
        "purpose",
        "dimensions",
        "entrancePortalRefs",
        "styleText",
        "siteRules"
      ],
      "additionalProperties": false,
      "x-typeName": "Controls"
    },
    "CoverageWitness": {
      "type": "object",
      "properties": {
        "evidence": {
          "$ref": "#/definitions/EvidenceBinding"
        },
        "positions": {
          "$ref": "#/definitions/Positions"
        }
      },
      "required": [
        "evidence",
        "positions"
      ],
      "additionalProperties": false,
      "x-typeName": "CoverageWitness"
    },
    "Digest": {
      "type": "string",
      "pattern": "^[0-9a-f]{64}$",
      "x-typeName": "Digest"
    },
    "Effect": {
      "type": "object",
      "properties": {
        "geometryProfile": {
          "$ref": "#/definitions/GeometryProfile"
        },
        "position": {
          "$ref": "#/definitions/Position"
        },
        "materialRef": {
          "$ref": "#/definitions/Ref"
        },
        "orientation": {
          "$ref": "#/definitions/Orientation"
        }
      },
      "required": [
        "geometryProfile",
        "position",
        "materialRef",
        "orientation"
      ],
      "additionalProperties": false,
      "x-typeName": "Effect"
    },
    "Effects": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Effect"
      },
      "minItems": 1,
      "x-typeName": "Effects",
      "x-order": "position numeric x,y,z",
      "x-uniqueBy": "position"
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
    "Entrance": {
      "type": "object",
      "properties": {
        "portalRef": {
          "anyOf": [
            {
              "$ref": "#/definitions/Ref"
            },
            {
              "type": "null"
            }
          ]
        },
        "usablePositions": {
          "$ref": "#/definitions/Positions"
        },
        "path": {
          "$ref": "#/definitions/PositionPath"
        }
      },
      "required": [
        "portalRef",
        "usablePositions",
        "path"
      ],
      "additionalProperties": false
    },
    "EntranceWitness": {
      "type": "object",
      "properties": {
        "evidence": {
          "$ref": "#/definitions/EvidenceBinding"
        },
        "portalRef": {
          "anyOf": [
            {
              "$ref": "#/definitions/Ref"
            },
            {
              "type": "null"
            }
          ]
        },
        "usablePositions": {
          "$ref": "#/definitions/Positions"
        },
        "path": {
          "$ref": "#/definitions/PositionPath"
        },
        "clearance": {
          "$ref": "#/definitions/ClearanceCells"
        }
      },
      "required": [
        "evidence",
        "portalRef",
        "usablePositions",
        "path",
        "clearance"
      ],
      "additionalProperties": false,
      "x-typeName": "EntranceWitness"
    },
    "Entrances": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Entrance"
      }
    },
    "ErrorReason": {
      "enum": [
        "INVALID_UTF8",
        "DUPLICATE_DECODED_KEY",
        "LONE_SURROGATE",
        "INVALID_NUMBER",
        "INVALID_SHAPE",
        "UNKNOWN_FIELD",
        "VERSION_UNSUPPORTED",
        "IDENTITY_UNVERIFIED",
        "SCOPE_DENIED",
        "PAYLOAD_CHANGED",
        "REVISION_CHANGED",
        "INVALID_GEOMETRY",
        "CATALOGUE_UNRESOLVED",
        "REQUIRED_FACT_UNKNOWN",
        "POLICY_UNAVAILABLE",
        "LIMIT_EXCEEDED",
        "NAME_FORBIDDEN_CHARACTER",
        "NAME_INVISIBLE_OR_EMPTY",
        "NAME_KEY_EXISTS",
        "MEDIA_NOT_REFERENCED",
        "MEDIA_CORRUPT",
        "DELETE_SEAM_ABSENT",
        "RESOURCE_MISSING",
        "UNSUPPORTED_STATE_COVERAGE",
        "APPLY_ERROR",
        "READBACK_ERROR",
        "RESTORE_ERROR",
        "PERSIST_ERROR",
        "EXTERNAL_EDIT_CONFLICT",
        "TRANSPORT_OUTCOME_UNKNOWN",
        "OWNERSHIP_VIOLATION",
        "GEOMETRY_PROFILE_UNSUPPORTED"
      ],
      "x-typeName": "ErrorReason"
    },
    "EvidenceBinding": {
      "type": "object",
      "properties": {
        "providerRef": {
          "$ref": "#/definitions/Ref"
        },
        "sourceRevision": {
          "$ref": "#/definitions/Revision"
        },
        "worldRef": {
          "anyOf": [
            {
              "$ref": "#/definitions/Ref"
            },
            {
              "type": "null"
            }
          ]
        },
        "worldRevision": {
          "anyOf": [
            {
              "$ref": "#/definitions/Revision"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "providerRef",
        "sourceRevision",
        "worldRef",
        "worldRevision"
      ],
      "additionalProperties": false,
      "x-typeName": "EvidenceBinding"
    },
    "FactsSource": {
      "enum": [
        "INSPECTED",
        "PLANNED",
        "REGION_INSPECTED"
      ],
      "x-typeName": "FactsSource"
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
    "FinalEffects": {
      "type": "object",
      "properties": {
        "profileVersion": {
          "const": "final-effects/v3"
        },
        "frameDigest": {
          "$ref": "#/definitions/Digest"
        },
        "catalogueDigest": {
          "$ref": "#/definitions/Digest"
        },
        "effects": {
          "$ref": "#/definitions/Effects"
        }
      },
      "required": [
        "profileVersion",
        "frameDigest",
        "catalogueDigest",
        "effects"
      ],
      "additionalProperties": false,
      "x-typeName": "FinalEffects"
    },
    "Frame": {
      "type": "object",
      "properties": {
        "profileVersion": {
          "const": "frame/v2"
        },
        "frameId": {
          "$ref": "#/definitions/Ref"
        },
        "origin": {
          "$ref": "#/definitions/Position"
        },
        "axes": {
          "$ref": "#/definitions/Axes"
        },
        "handedness": {
          "$ref": "#/definitions/Handedness"
        },
        "gridUnit": {
          "$ref": "#/definitions/GridUnit"
        },
        "transformRevision": {
          "$ref": "#/definitions/Revision"
        }
      },
      "required": [
        "profileVersion",
        "frameId",
        "origin",
        "axes",
        "handedness",
        "gridUnit",
        "transformRevision"
      ],
      "additionalProperties": false,
      "x-typeName": "Frame"
    },
    "Geometry": {
      "type": "object",
      "properties": {
        "materials": {
          "$ref": "#/definitions/MaterialMap"
        },
        "operations": {
          "$ref": "#/definitions/BuildOps"
        },
        "effects": {
          "$ref": "#/definitions/Effects"
        },
        "declaredBounds": {
          "$ref": "#/definitions/Box"
        }
      },
      "required": [
        "materials",
        "operations",
        "effects",
        "declaredBounds"
      ],
      "additionalProperties": false
    },
    "GeometryInput": {
      "type": "object",
      "properties": {
        "proposal": {
          "$ref": "#/definitions/BuildProposal"
        },
        "catalogue": {
          "$ref": "#/definitions/Catalogue"
        },
        "targetFacts": {
          "$ref": "#/definitions/TargetFacts"
        }
      },
      "required": [
        "proposal",
        "catalogue",
        "targetFacts"
      ],
      "additionalProperties": false
    },
    "GeometryProfile": {
      "x-typeName": "GeometryProfile",
      "enum": [
        "voxel-grid/v1"
      ],
      "x-meaning": "Geometry profile of a payload. This major defines only voxel-grid/v1: integer grid positions, closed integer boxes, one material per cell. Another profile is a new variant added beside it, never a change of this one. A payload whose profile the world source does not declare is refused with CAPABILITY_GAP, never guessed."
    },
    "GridUnit": {
      "type": "object",
      "properties": {
        "name": {
          "$ref": "#/definitions/Ref"
        },
        "metersPerGridUnit": {
          "anyOf": [
            {
              "$ref": "#/definitions/PositiveFinite"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "name",
        "metersPerGridUnit"
      ],
      "additionalProperties": false,
      "x-typeName": "GridUnit"
    },
    "Handedness": {
      "enum": [
        "left",
        "right"
      ],
      "x-typeName": "Handedness"
    },
    "HazardPolicy": {
      "type": "object",
      "properties": {
        "forbidLiquid": {
          "$ref": "#/definitions/Bool"
        },
        "maximumDamagePerSecond": {
          "$ref": "#/definitions/NonNegativeFinite"
        }
      },
      "required": [
        "forbidLiquid",
        "maximumDamagePerSecond"
      ],
      "additionalProperties": false,
      "x-typeName": "HazardPolicy"
    },
    "HazardWitness": {
      "type": "object",
      "properties": {
        "evidence": {
          "$ref": "#/definitions/EvidenceBinding"
        },
        "positions": {
          "$ref": "#/definitions/Positions"
        },
        "forbidLiquid": {
          "$ref": "#/definitions/Bool"
        },
        "maximumDamagePerSecond": {
          "$ref": "#/definitions/NonNegativeFinite"
        }
      },
      "required": [
        "evidence",
        "positions",
        "forbidLiquid",
        "maximumDamagePerSecond"
      ],
      "additionalProperties": false,
      "x-typeName": "HazardWitness"
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
    "ImageMaterialFailure": {
      "type": "object",
      "properties": {
        "name": {
          "const": "ImageMaterialError"
        },
        "code": {
          "const": "CAPABILITY_UNAVAILABLE"
        },
        "message": {
          "type": "string",
          "minLength": 1
        },
        "mutationState": {
          "const": "NONE"
        }
      },
      "required": [
        "name",
        "code",
        "message",
        "mutationState"
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
    "IntentKind": {
      "enum": [
        "BUILD_STRUCTURE",
        "MODIFY_INTERIOR",
        "MODIFY_OBJECT",
        "UNDO",
        "REDO"
      ],
      "x-typeName": "IntentKind"
    },
    "IntentProjection": {
      "oneOf": [
        {
          "$ref": "#/definitions/IntentProjectionV5"
        },
        {
          "$ref": "#/definitions/IntentProjectionV6"
        }
      ],
      "x-typeName": "IntentProjection"
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
    "LightRule": {
      "type": "object",
      "properties": {
        "minimumLight": {
          "$ref": "#/definitions/UnitInterval"
        },
        "sourceRevision": {
          "$ref": "#/definitions/Revision"
        }
      },
      "required": [
        "minimumLight",
        "sourceRevision"
      ],
      "additionalProperties": false,
      "x-typeName": "LightRule",
      "x-meaning": "minimumLight is normalised: 0 is the darkest and 1 the brightest light level the world source reports. The world source maps its own light scale onto it."
    },
    "LocalRequestFacts": {
      "x-typeName": "LocalRequestFacts",
      "type": "object",
      "properties": {
        "currentContext": {
          "anyOf": [
            {
              "$ref": "#/definitions/LocalWorldContext"
            },
            {
              "type": "null"
            }
          ]
        },
        "sessionRef": {
          "$ref": "#/definitions/Ref"
        },
        "currentTurnRevision": {
          "anyOf": [
            {
              "$ref": "#/definitions/Revision"
            },
            {
              "type": "null"
            }
          ]
        },
        "currentBriefDigest": {
          "anyOf": [
            {
              "$ref": "#/definitions/Digest"
            },
            {
              "type": "null"
            }
          ]
        },
        "requestState": {
          "$ref": "#/definitions/LocalRequestState"
        },
        "replay": {
          "$ref": "#/definitions/BuildEntryReplay"
        },
        "priorRequestDigest": {
          "anyOf": [
            {
              "$ref": "#/definitions/Digest"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "currentContext",
        "sessionRef",
        "currentTurnRevision",
        "currentBriefDigest",
        "requestState",
        "replay",
        "priorRequestDigest"
      ],
      "additionalProperties": false
    },
    "LocalRequestState": {
      "x-typeName": "LocalRequestState",
      "enum": [
        "ACTIVE",
        "CANCELLED",
        "COMPLETED",
        "UNKNOWN"
      ]
    },
    "LocalWorldContext": {
      "x-typeName": "LocalWorldContext",
      "type": "object",
      "properties": {
        "connectionRef": {
          "$ref": "#/definitions/Ref"
        },
        "connectionIncarnationRef": {
          "$ref": "#/definitions/Ref"
        },
        "worldRef": {
          "$ref": "#/definitions/Ref"
        },
        "selectionRevision": {
          "$ref": "#/definitions/Revision"
        }
      },
      "required": [
        "connectionRef",
        "connectionIncarnationRef",
        "worldRef",
        "selectionRevision"
      ],
      "additionalProperties": false
    },
    "MaterialMap": {
      "type": "object",
      "propertyNames": {
        "$ref": "#/definitions/Ref"
      },
      "additionalProperties": {
        "$ref": "#/definitions/MaterialSpec"
      },
      "minProperties": 1,
      "x-typeName": "MaterialMap"
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
    "Media": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/MediaBinding"
      },
      "x-typeName": "Media",
      "x-order": "user input"
    },
    "MediaBinding": {
      "type": "object",
      "properties": {
        "attachmentRef": {
          "$ref": "#/definitions/Ref"
        },
        "storedBytesDigest": {
          "$ref": "#/definitions/Digest"
        },
        "projectionVariantId": {
          "anyOf": [
            {
              "$ref": "#/definitions/Ref"
            },
            {
              "type": "null"
            }
          ]
        },
        "projectionBytesDigest": {
          "anyOf": [
            {
              "$ref": "#/definitions/Digest"
            },
            {
              "type": "null"
            }
          ]
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
        "attachmentRef",
        "storedBytesDigest",
        "projectionVariantId",
        "projectionBytesDigest",
        "mediaType",
        "bytes",
        "width",
        "height"
      ],
      "additionalProperties": false,
      "x-typeName": "MediaBinding"
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
    "MutationState": {
      "enum": [
        "NONE",
        "VERIFIED",
        "ROLLED_BACK",
        "PARTIAL",
        "UNKNOWN"
      ],
      "x-typeName": "MutationState"
    },
    "NonNegativeFinite": {
      "type": "number",
      "minimum": 0,
      "x-typeName": "NonNegativeFinite",
      "x-finite": true
    },
    "NonNegativeInt": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "x-typeName": "NonNegativeInt"
    },
    "OccupiedCell": {
      "type": "object",
      "properties": {
        "position": {
          "$ref": "#/definitions/Position"
        },
        "materialRef": {
          "$ref": "#/definitions/Ref"
        },
        "orientation": {
          "$ref": "#/definitions/Orientation"
        }
      },
      "required": [
        "position",
        "materialRef",
        "orientation"
      ],
      "additionalProperties": false,
      "x-typeName": "OccupiedCell"
    },
    "OccupiedCells": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/OccupiedCell"
      },
      "x-typeName": "OccupiedCells",
      "x-order": "position numeric x,y,z",
      "x-uniqueBy": "position"
    },
    "OpaqueCode": {
      "type": "string",
      "minLength": 1,
      "x-typeName": "OpaqueCode",
      "x-normalization": "NONE; exact Unicode scalar sequence; never trim/lower/NFC; not a path",
      "x-meaning": "A reason code defined by the world source. Consumers show or relay it; they never branch on its value."
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
    "OrderedRefs": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Ref"
      },
      "uniqueItems": true,
      "x-typeName": "OrderedRefs",
      "x-order": "input"
    },
    "Orientation": {
      "x-typeName": "Orientation",
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991,
      "x-meaning": "Neutral orientation index of a material, from the set the Catalogue declares for that material. Conversion to an engine encoding happens only inside the world source."
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
    "Phase": {
      "enum": [
        "decode",
        "replay",
        "validate",
        "apply",
        "readback",
        "restore",
        "persist"
      ],
      "x-typeName": "Phase"
    },
    "PlacementAnchorKind": {
      "enum": [
        "CURRENT_VIEW",
        "PICKED_POINT"
      ],
      "x-typeName": "PlacementAnchorKind"
    },
    "PlacementCells": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Position"
      },
      "minItems": 1,
      "uniqueItems": true,
      "x-typeName": "PlacementCells",
      "x-order": "numeric x,y,z"
    },
    "PlacementProposal": {
      "type": "object",
      "properties": {
        "profileVersion": {
          "const": "placement-proposal/v1"
        },
        "worldRef": {
          "$ref": "#/definitions/Ref"
        },
        "source": {
          "$ref": "#/definitions/PlacementSource"
        },
        "target": {
          "$ref": "#/definitions/PlacementTarget"
        }
      },
      "required": [
        "profileVersion",
        "worldRef",
        "source",
        "target"
      ],
      "additionalProperties": false,
      "x-typeName": "PlacementProposal"
    },
    "PlacementSettings": {
      "type": "object",
      "properties": {
        "frontGapCells": {
          "$ref": "#/definitions/NonNegativeInt"
        },
        "forwardSearchCells": {
          "$ref": "#/definitions/NonNegativeInt"
        },
        "lateralSearchCells": {
          "$ref": "#/definitions/NonNegativeInt"
        },
        "verticalSearchCells": {
          "$ref": "#/definitions/NonNegativeInt"
        },
        "settingsRevision": {
          "$ref": "#/definitions/Revision"
        }
      },
      "required": [
        "frontGapCells",
        "forwardSearchCells",
        "lateralSearchCells",
        "verticalSearchCells",
        "settingsRevision"
      ],
      "additionalProperties": false,
      "x-typeName": "PlacementSettings"
    },
    "PlacementSource": {
      "type": "object",
      "properties": {
        "inspectionId": {
          "$ref": "#/definitions/Ref"
        },
        "anchorKind": {
          "$ref": "#/definitions/PlacementAnchorKind"
        },
        "worldRevision": {
          "$ref": "#/definitions/Revision"
        },
        "targetFactsDigest": {
          "$ref": "#/definitions/Digest"
        },
        "frameDigest": {
          "$ref": "#/definitions/Digest"
        }
      },
      "required": [
        "inspectionId",
        "anchorKind",
        "worldRevision",
        "targetFactsDigest",
        "frameDigest"
      ],
      "additionalProperties": false,
      "x-typeName": "PlacementSource"
    },
    "PlacementTarget": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "kind": {
              "const": "EXACT_CELLS"
            },
            "cells": {
              "$ref": "#/definitions/PlacementCells"
            }
          },
          "required": [
            "kind",
            "cells"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "kind": {
              "const": "ANCHORED_EXTENT"
            },
            "bounds": {
              "$ref": "#/definitions/Box"
            }
          },
          "required": [
            "kind",
            "bounds"
          ],
          "additionalProperties": false
        }
      ],
      "x-discriminator": "kind",
      "x-variantKeys": [
        "EXACT_CELLS",
        "ANCHORED_EXTENT"
      ],
      "x-typeName": "PlacementTarget"
    },
    "PlanEntrancesInput": {
      "type": "object",
      "properties": {
        "request": {
          "$ref": "#/definitions/ValidateBuildProposalRequest"
        },
        "geometry": {
          "$ref": "#/definitions/Geometry"
        },
        "entranceFacing": {
          "anyOf": [
            {
              "$ref": "#/definitions/Axis"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "request",
        "geometry",
        "entranceFacing"
      ],
      "additionalProperties": false
    },
    "Portal": {
      "type": "object",
      "properties": {
        "portalRef": {
          "$ref": "#/definitions/Ref"
        },
        "positions": {
          "$ref": "#/definitions/Positions"
        }
      },
      "required": [
        "portalRef",
        "positions"
      ],
      "additionalProperties": false,
      "x-typeName": "Portal"
    },
    "Portals": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Portal"
      },
      "x-typeName": "Portals",
      "x-order": "portalRef UTF16 ascending",
      "x-uniqueBy": "portalRef"
    },
    "Position": {
      "type": "array",
      "items": [
        {
          "$ref": "#/definitions/SafeInt"
        },
        {
          "$ref": "#/definitions/SafeInt"
        },
        {
          "$ref": "#/definitions/SafeInt"
        }
      ],
      "minItems": 3,
      "maxItems": 3,
      "additionalItems": false,
      "x-typeName": "Position",
      "x-order": "x,y,z"
    },
    "PositionPath": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Position"
      },
      "minItems": 1,
      "x-typeName": "PositionPath",
      "x-order": "path traversal"
    },
    "Positions": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Position"
      },
      "uniqueItems": true,
      "x-typeName": "Positions",
      "x-order": "numeric x,y,z"
    },
    "PositiveFinite": {
      "type": "number",
      "exclusiveMinimum": 0,
      "x-typeName": "PositiveFinite",
      "x-finite": true
    },
    "PositiveInt": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991,
      "x-typeName": "PositiveInt"
    },
    "PromptText": {
      "type": "string",
      "minLength": 1
    },
    "ProtocolDescriptor": {
      "x-typeName": "ProtocolDescriptor",
      "type": "object",
      "properties": {
        "protocol": {
          "$ref": "#/definitions/Ref"
        },
        "major": {
          "$ref": "#/definitions/PositiveInt"
        },
        "minor": {
          "$ref": "#/definitions/NonNegativeInt"
        }
      },
      "required": [
        "protocol",
        "major",
        "minor"
      ],
      "additionalProperties": false
    },
    "ProtocolDescriptors": {
      "x-typeName": "ProtocolDescriptors",
      "type": "array",
      "items": {
        "$ref": "#/definitions/ProtocolDescriptor"
      },
      "x-order": "protocol UTF16 ascending",
      "x-uniqueBy": "protocol",
      "minItems": 1
    },
    "ProtocolHandshake": {
      "x-typeName": "ProtocolHandshake",
      "type": "object",
      "properties": {
        "profileVersion": {
          "const": "protocol-handshake/v1"
        },
        "component": {
          "$ref": "#/definitions/Ref"
        },
        "protocols": {
          "$ref": "#/definitions/ProtocolDescriptors"
        },
        "capabilities": {
          "$ref": "#/definitions/RefSet"
        },
        "provenance": {
          "$ref": "#/definitions/ProtocolProvenance"
        }
      },
      "required": [
        "profileVersion",
        "component",
        "protocols",
        "capabilities",
        "provenance"
      ],
      "additionalProperties": false
    },
    "ProtocolProvenance": {
      "x-typeName": "ProtocolProvenance",
      "type": "object",
      "properties": {
        "packageName": {
          "$ref": "#/definitions/Ref"
        },
        "packageVersion": {
          "$ref": "#/definitions/Ref"
        },
        "sourceRevision": {
          "anyOf": [
            {
              "$ref": "#/definitions/Ref"
            },
            {
              "type": "null"
            }
          ]
        },
        "artifactDigest": {
          "anyOf": [
            {
              "$ref": "#/definitions/Digest"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "packageName",
        "packageVersion",
        "sourceRevision",
        "artifactDigest"
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
    "Ref": {
      "type": "string",
      "minLength": 1,
      "x-typeName": "Ref",
      "x-normalization": "NONE; exact Unicode scalar sequence; never trim/lower/NFC; not a path"
    },
    "RefSet": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Ref"
      },
      "uniqueItems": true,
      "x-typeName": "RefSet",
      "x-order": "UTF16 ascending"
    },
    "RegionBuildPlan": {
      "x-typeName": "RegionBuildPlan",
      "type": "object",
      "properties": {
        "invocationId": {
          "$ref": "#/definitions/Ref"
        },
        "build": {
          "$ref": "#/definitions/RegionBuildProjection"
        },
        "buildDigest": {
          "$ref": "#/definitions/Digest"
        }
      },
      "required": [
        "invocationId",
        "build",
        "buildDigest"
      ],
      "additionalProperties": false
    },
    "RegionBuildProjection": {
      "x-typeName": "RegionBuildProjection",
      "type": "object",
      "properties": {
        "contractVersion": {
          "const": "region-build/v2"
        },
        "documentId": {
          "$ref": "#/definitions/Ref"
        },
        "coordinateSpace": {
          "const": "WORLD_NODE"
        },
        "worldRef": {
          "$ref": "#/definitions/Ref"
        },
        "catalogueDigest": {
          "$ref": "#/definitions/Digest"
        },
        "block": {
          "$ref": "#/definitions/RegionVoxelBlock"
        },
        "declaredBounds": {
          "$ref": "#/definitions/Box"
        }
      },
      "required": [
        "contractVersion",
        "documentId",
        "coordinateSpace",
        "worldRef",
        "catalogueDigest",
        "block",
        "declaredBounds"
      ],
      "additionalProperties": false
    },
    "RegionInspection": {
      "type": "object",
      "properties": {
        "inspectionId": {
          "$ref": "#/definitions/Ref"
        },
        "anchorKind": {
          "$ref": "#/definitions/PlacementAnchorKind"
        },
        "targetFacts": {
          "$ref": "#/definitions/TargetFacts"
        },
        "targetFactsDigest": {
          "$ref": "#/definitions/Digest"
        },
        "frame": {
          "$ref": "#/definitions/Frame"
        },
        "evidence": {
          "$ref": "#/definitions/EvidenceBinding"
        },
        "entranceFacing": {
          "$ref": "#/definitions/Axis"
        },
        "placementSettings": {
          "$ref": "#/definitions/PlacementSettings"
        }
      },
      "required": [
        "inspectionId",
        "anchorKind",
        "targetFacts",
        "targetFactsDigest",
        "frame",
        "evidence",
        "entranceFacing",
        "placementSettings"
      ],
      "additionalProperties": false,
      "x-typeName": "RegionInspection"
    },
    "RegionPalette": {
      "x-typeName": "RegionPalette",
      "type": "array",
      "items": {
        "$ref": "#/definitions/MaterialSpec"
      },
      "x-order": "materialRef UTF16 then orientation numeric",
      "x-uniqueBy": "materialRef,orientation",
      "minItems": 1
    },
    "RegionProposal": {
      "x-typeName": "RegionProposal",
      "type": "object",
      "properties": {
        "decision": {
          "const": "REGION"
        },
        "block": {
          "$ref": "#/definitions/RegionVoxelBlock"
        }
      },
      "required": [
        "decision",
        "block"
      ],
      "additionalProperties": false
    },
    "RegionRun": {
      "x-typeName": "RegionRun",
      "type": "array",
      "items": [
        {
          "$ref": "#/definitions/PositiveInt"
        },
        {
          "anyOf": [
            {
              "$ref": "#/definitions/NonNegativeInt"
            },
            {
              "type": "null"
            }
          ]
        }
      ],
      "minItems": 2,
      "maxItems": 2,
      "additionalItems": false,
      "x-order": "[count, palette index | null=UNSPECIFIED]"
    },
    "RegionRuns": {
      "x-typeName": "RegionRuns",
      "type": "array",
      "items": {
        "$ref": "#/definitions/RegionRun"
      },
      "x-order": "VoxelArea index order: x fastest, then y, then z",
      "minItems": 1
    },
    "RegionSize": {
      "x-typeName": "RegionSize",
      "type": "array",
      "items": [
        {
          "$ref": "#/definitions/PositiveInt"
        },
        {
          "$ref": "#/definitions/PositiveInt"
        },
        {
          "$ref": "#/definitions/PositiveInt"
        }
      ],
      "minItems": 3,
      "maxItems": 3,
      "additionalItems": false,
      "x-order": "x,y,z extent in cells"
    },
    "RegionVoxelBlock": {
      "x-typeName": "RegionVoxelBlock",
      "type": "object",
      "properties": {
        "profileVersion": {
          "const": "region-voxels/v2"
        },
        "geometryProfile": {
          "$ref": "#/definitions/GeometryProfile"
        },
        "origin": {
          "$ref": "#/definitions/Position"
        },
        "size": {
          "$ref": "#/definitions/RegionSize"
        },
        "indexOrder": {
          "const": "X_FASTEST_THEN_Y_THEN_Z"
        },
        "palette": {
          "$ref": "#/definitions/RegionPalette"
        },
        "runs": {
          "$ref": "#/definitions/RegionRuns"
        }
      },
      "required": [
        "profileVersion",
        "geometryProfile",
        "origin",
        "size",
        "indexOrder",
        "palette",
        "runs"
      ],
      "additionalProperties": false
    },
    "Retryability": {
      "enum": [
        "NEVER",
        "AFTER_NEW_FACTS",
        "SAME_TRANSACTION_QUERY",
        "AFTER_MANUAL_RECOVERY"
      ],
      "x-typeName": "Retryability"
    },
    "Revision": {
      "type": "string",
      "minLength": 1,
      "x-typeName": "Revision",
      "x-normalization": "NONE; opaque equality, never numeric ordering"
    },
    "SafeInt": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991,
      "x-typeName": "SafeInt"
    },
    "SafetyProfile": {
      "type": "object",
      "properties": {
        "profileVersion": {
          "const": "safety-profile/v5"
        },
        "connectivity": {
          "const": 6
        },
        "requireBodyClearance": {
          "$ref": "#/definitions/Bool"
        },
        "requireEntranceConnectivity": {
          "$ref": "#/definitions/Bool"
        },
        "hazardPolicy": {
          "$ref": "#/definitions/HazardPolicy"
        },
        "optionalLightRule": {
          "anyOf": [
            {
              "$ref": "#/definitions/LightRule"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "profileVersion",
        "connectivity",
        "requireBodyClearance",
        "requireEntranceConnectivity",
        "hazardPolicy",
        "optionalLightRule"
      ],
      "additionalProperties": false,
      "x-typeName": "SafetyProfile"
    },
    "SetBox": {
      "type": "object",
      "properties": {
        "op": {
          "const": "set_box"
        },
        "min": {
          "$ref": "#/definitions/Position"
        },
        "max": {
          "$ref": "#/definitions/Position"
        },
        "materialRef": {
          "$ref": "#/definitions/Ref"
        }
      },
      "required": [
        "op",
        "min",
        "max",
        "materialRef"
      ],
      "additionalProperties": false,
      "x-typeName": "SetBox"
    },
    "SiteRules": {
      "type": "object",
      "properties": {
        "requireEntranceConnectivity": {
          "$ref": "#/definitions/Bool"
        },
        "entranceClearance": {
          "anyOf": [
            {
              "$ref": "#/definitions/ClearanceCells"
            },
            {
              "type": "null"
            }
          ]
        },
        "hazardPolicy": {
          "$ref": "#/definitions/HazardPolicy"
        },
        "optionalLightRule": {
          "anyOf": [
            {
              "$ref": "#/definitions/LightRule"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "requireEntranceConnectivity",
        "entranceClearance",
        "hazardPolicy",
        "optionalLightRule"
      ],
      "additionalProperties": false,
      "x-typeName": "SiteRules"
    },
    "SourcePublicError": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CAPABILITY_UNAVAILABLE"
            },
            "phase": {
              "const": "readback"
            },
            "retryability": {
              "const": "SAME_TRANSACTION_QUERY"
            },
            "mutationState": {
              "const": "UNKNOWN"
            },
            "transactionRef": {
              "const": "fixture-tx"
            },
            "causeCode": {
              "const": "APPLY_FAILED"
            },
            "reason": {
              "const": "TRANSPORT_OUTCOME_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CAPABILITY_UNAVAILABLE"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "POLICY_UNAVAILABLE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        }
      ],
      "x-authority": "C-painter carried sample value closure; actual original source closure NOT supplied"
    },
    "TargetFacts": {
      "type": "object",
      "properties": {
        "profileVersion": {
          "const": "target-facts/v5"
        },
        "geometryProfile": {
          "$ref": "#/definitions/GeometryProfile"
        },
        "source": {
          "$ref": "#/definitions/FactsSource"
        },
        "worldRef": {
          "anyOf": [
            {
              "$ref": "#/definitions/Ref"
            },
            {
              "type": "null"
            }
          ]
        },
        "objectRef": {
          "anyOf": [
            {
              "$ref": "#/definitions/Ref"
            },
            {
              "type": "null"
            }
          ]
        },
        "worldRevision": {
          "anyOf": [
            {
              "$ref": "#/definitions/Revision"
            },
            {
              "type": "null"
            }
          ]
        },
        "objectRevision": {
          "anyOf": [
            {
              "$ref": "#/definitions/Revision"
            },
            {
              "type": "null"
            }
          ]
        },
        "buildDigest": {
          "anyOf": [
            {
              "$ref": "#/definitions/Digest"
            },
            {
              "type": "null"
            }
          ]
        },
        "planRevision": {
          "anyOf": [
            {
              "$ref": "#/definitions/Revision"
            },
            {
              "type": "null"
            }
          ]
        },
        "catalogueDigest": {
          "$ref": "#/definitions/Digest"
        },
        "frameDigest": {
          "$ref": "#/definitions/Digest"
        },
        "sampledBounds": {
          "$ref": "#/definitions/Box"
        },
        "coverageDigest": {
          "$ref": "#/definitions/Digest"
        },
        "occupiedCells": {
          "$ref": "#/definitions/OccupiedCells"
        },
        "knownEmptyCells": {
          "$ref": "#/definitions/Positions"
        },
        "unknownCells": {
          "$ref": "#/definitions/UnknownCells"
        },
        "portals": {
          "$ref": "#/definitions/Portals"
        },
        "usableVolume": {
          "anyOf": [
            {
              "$ref": "#/definitions/UsableVolume"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "profileVersion",
        "geometryProfile",
        "source",
        "worldRef",
        "objectRef",
        "worldRevision",
        "objectRevision",
        "buildDigest",
        "planRevision",
        "catalogueDigest",
        "frameDigest",
        "sampledBounds",
        "coverageDigest",
        "occupiedCells",
        "knownEmptyCells",
        "unknownCells",
        "portals",
        "usableVolume"
      ],
      "additionalProperties": false,
      "x-typeName": "TargetFacts"
    },
    "Text": {
      "type": "string",
      "x-typeName": "Text",
      "x-normalization": "NONE"
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
    "Trusted": {
      "type": "object",
      "properties": {
        "frame": {
          "$ref": "#/definitions/Frame"
        },
        "evidence": {
          "$ref": "#/definitions/EvidenceBinding"
        }
      },
      "required": [
        "frame",
        "evidence"
      ],
      "additionalProperties": false
    },
    "UnitInterval": {
      "x-typeName": "UnitInterval",
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "UnknownCell": {
      "type": "object",
      "properties": {
        "position": {
          "$ref": "#/definitions/Position"
        },
        "reason": {
          "$ref": "#/definitions/OpaqueCode"
        }
      },
      "required": [
        "position",
        "reason"
      ],
      "additionalProperties": false,
      "x-typeName": "UnknownCell"
    },
    "UnknownCells": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/UnknownCell"
      },
      "x-typeName": "UnknownCells",
      "x-order": "position numeric x,y,z",
      "x-uniqueBy": "position"
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
    "UsableVolume": {
      "type": "object",
      "properties": {
        "emptyCellCount": {
          "$ref": "#/definitions/NonNegativeInt"
        },
        "physicalVolume": {
          "anyOf": [
            {
              "$ref": "#/definitions/NonNegativeFinite"
            },
            {
              "type": "null"
            }
          ]
        },
        "standingArea": {
          "anyOf": [
            {
              "$ref": "#/definitions/NonNegativeFinite"
            },
            {
              "type": "null"
            }
          ]
        },
        "unit": {
          "$ref": "#/definitions/Ref"
        }
      },
      "required": [
        "emptyCellCount",
        "physicalVolume",
        "standingArea",
        "unit"
      ],
      "additionalProperties": false,
      "x-typeName": "UsableVolume"
    },
    "ValidateBuildProposalError": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_UTF8"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "DUPLICATE_DECODED_KEY"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "LONE_SURROGATE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_NUMBER"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_SHAPE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_SHAPE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "INTENT_UNCONFIRMED"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REQUIRED_FACT_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CURRENT_WORLD_MISMATCH"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REVISION_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "REQUEST_CANCELLED"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REVISION_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CAPABILITY_UNAVAILABLE"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "POLICY_UNAVAILABLE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "REQUEST_NOT_ACTIVE"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REQUIRED_FACT_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "REPLAY_MISMATCH"
            },
            "phase": {
              "const": "replay"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "PAYLOAD_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "INTENT_UNCONFIRMED"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "PAYLOAD_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "BUILD_INVALID"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_SHAPE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "BUILD_INVALID"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_GEOMETRY"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "UNSUPPORTED_MATERIAL"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "CATALOGUE_UNRESOLVED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "UNSUPPORTED_MATERIAL"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REQUIRED_FACT_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "TARGET_FACTS_INCOMPLETE"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REQUIRED_FACT_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "TARGET_FACTS_STALE"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REVISION_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "UNKNOWN_REQUIRED_FIELD"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "UNKNOWN_FIELD"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "UNSUPPORTED_VERSION"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "VERSION_UNSUPPORTED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_GEOMETRY"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SAFETY_INVARIANT_FAILED"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REQUIRED_FACT_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "$ref": "#/definitions/ValidateBuildProposalSourceError"
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "TURN_REVISION_MISMATCH"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REVISION_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "TRANSACTION_CONFLICT"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "PAYLOAD_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CATALOGUE_MISMATCH"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "CATALOGUE_UNRESOLVED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "UNSUPPORTED_MUTATION_SEMANTICS"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REQUIRED_FACT_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "INTENT_UNCONFIRMED"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "IDENTITY_UNVERIFIED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CURRENT_WORLD_MISMATCH"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "SCOPE_DENIED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "INVALID_FRAME"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "PAYLOAD_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "TARGET_FACTS_STALE"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "PAYLOAD_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "INTENT_UNCONFIRMED"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_GEOMETRY"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CAPABILITY_UNAVAILABLE"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REQUIRED_FACT_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "NON_CANONICAL_AMBIGUITY"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "PAYLOAD_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "MEDIA_DIGEST_MISMATCH"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "PAYLOAD_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        }
      ]
    },
    "ValidateBuildProposalRequest": {
      "oneOf": [
        {
          "$ref": "#/definitions/ValidateBuildProposalRequestV5"
        },
        {
          "$ref": "#/definitions/ValidateBuildProposalRequestV6"
        }
      ],
      "x-typeName": "ValidateBuildProposalRequest",
      "x-versionPairing": "Exact pair: session/v5 + ReferenceBrief/v5 OR session/v6 + ReferenceBrief/v6; mixed rejected UNSUPPORTED_VERSION/decode/VERSION_UNSUPPORTED"
    },
    "ValidateBuildProposalResponse": {
      "type": "object",
      "properties": {
        "contractVersion": {
          "const": "painter/v6"
        },
        "requestId": {
          "$ref": "#/definitions/Ref"
        },
        "result": {
          "anyOf": [
            {
              "$ref": "#/definitions/BuildPlan"
            },
            {
              "type": "null"
            }
          ]
        },
        "error": {
          "anyOf": [
            {
              "$ref": "#/definitions/ValidateBuildProposalError"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "contractVersion",
        "requestId",
        "result",
        "error"
      ],
      "additionalProperties": false,
      "x-typeName": "ValidateBuildProposalResponse"
    },
    "ValidateRegionProposalError": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_UTF8"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "DUPLICATE_DECODED_KEY"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "LONE_SURROGATE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_NUMBER"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_SHAPE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_SHAPE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "INTENT_UNCONFIRMED"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REQUIRED_FACT_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CURRENT_WORLD_MISMATCH"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REVISION_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "REQUEST_CANCELLED"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REVISION_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CAPABILITY_UNAVAILABLE"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "POLICY_UNAVAILABLE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "REQUEST_NOT_ACTIVE"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REQUIRED_FACT_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "REPLAY_MISMATCH"
            },
            "phase": {
              "const": "replay"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "PAYLOAD_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "UNKNOWN_REQUIRED_FIELD"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "UNKNOWN_FIELD"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "UNSUPPORTED_VERSION"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "VERSION_UNSUPPORTED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_GEOMETRY"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "$ref": "#/definitions/ValidateRegionProposalSourceError"
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CATALOGUE_MISMATCH"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "CATALOGUE_UNRESOLVED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "UNSUPPORTED_MUTATION_SEMANTICS"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REQUIRED_FACT_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "TRANSACTION_CONFLICT"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "PAYLOAD_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "TURN_REVISION_MISMATCH"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REVISION_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "UNSUPPORTED_MATERIAL"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REQUIRED_FACT_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SAFETY_INVARIANT_FAILED"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REQUIRED_FACT_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "INTENT_UNCONFIRMED"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "IDENTITY_UNVERIFIED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CURRENT_WORLD_MISMATCH"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "SCOPE_DENIED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "INTENT_UNCONFIRMED"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_GEOMETRY"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CAPABILITY_UNAVAILABLE"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "REQUIRED_FACT_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "NON_CANONICAL_AMBIGUITY"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "PAYLOAD_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "MEDIA_DIGEST_MISMATCH"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "PAYLOAD_CHANGED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        }
      ]
    },
    "ValidateRegionProposalRequest": {
      "oneOf": [
        {
          "$ref": "#/definitions/ValidateRegionProposalRequestV5"
        },
        {
          "$ref": "#/definitions/ValidateRegionProposalRequestV6"
        }
      ],
      "x-typeName": "ValidateRegionProposalRequest",
      "x-versionPairing": "Exact pair: session/v5 + ReferenceBrief/v5 OR session/v6 + ReferenceBrief/v6; mixed rejected UNSUPPORTED_VERSION/decode/VERSION_UNSUPPORTED"
    },
    "ValidateRegionProposalResponse": {
      "x-typeName": "ValidateRegionProposalResponse",
      "type": "object",
      "properties": {
        "contractVersion": {
          "const": "painter-region/v3"
        },
        "requestId": {
          "$ref": "#/definitions/Ref"
        },
        "result": {
          "anyOf": [
            {
              "$ref": "#/definitions/RegionBuildPlan"
            },
            {
              "type": "null"
            }
          ]
        },
        "error": {
          "anyOf": [
            {
              "$ref": "#/definitions/ValidateRegionProposalError"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "contractVersion",
        "requestId",
        "result",
        "error"
      ],
      "additionalProperties": false
    },
    "Witness": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "witnessId": {
              "$ref": "#/definitions/Ref"
            },
            "predicate": {
              "const": "COVERAGE"
            },
            "finalEffectsDigest": {
              "$ref": "#/definitions/Digest"
            },
            "targetFactsDigest": {
              "$ref": "#/definitions/Digest"
            },
            "safetyProfileDigest": {
              "$ref": "#/definitions/Digest"
            },
            "facts": {
              "$ref": "#/definitions/CoverageWitness"
            }
          },
          "required": [
            "witnessId",
            "predicate",
            "finalEffectsDigest",
            "targetFactsDigest",
            "safetyProfileDigest",
            "facts"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "witnessId": {
              "$ref": "#/definitions/Ref"
            },
            "predicate": {
              "const": "BODY_CLEARANCE"
            },
            "finalEffectsDigest": {
              "$ref": "#/definitions/Digest"
            },
            "targetFactsDigest": {
              "$ref": "#/definitions/Digest"
            },
            "safetyProfileDigest": {
              "$ref": "#/definitions/Digest"
            },
            "facts": {
              "$ref": "#/definitions/BodyWitness"
            }
          },
          "required": [
            "witnessId",
            "predicate",
            "finalEffectsDigest",
            "targetFactsDigest",
            "safetyProfileDigest",
            "facts"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "witnessId": {
              "$ref": "#/definitions/Ref"
            },
            "predicate": {
              "const": "ENTRANCE_CONNECTIVITY"
            },
            "finalEffectsDigest": {
              "$ref": "#/definitions/Digest"
            },
            "targetFactsDigest": {
              "$ref": "#/definitions/Digest"
            },
            "safetyProfileDigest": {
              "$ref": "#/definitions/Digest"
            },
            "facts": {
              "$ref": "#/definitions/EntranceWitness"
            }
          },
          "required": [
            "witnessId",
            "predicate",
            "finalEffectsDigest",
            "targetFactsDigest",
            "safetyProfileDigest",
            "facts"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "witnessId": {
              "$ref": "#/definitions/Ref"
            },
            "predicate": {
              "const": "HAZARD"
            },
            "finalEffectsDigest": {
              "$ref": "#/definitions/Digest"
            },
            "targetFactsDigest": {
              "$ref": "#/definitions/Digest"
            },
            "safetyProfileDigest": {
              "$ref": "#/definitions/Digest"
            },
            "facts": {
              "$ref": "#/definitions/HazardWitness"
            }
          },
          "required": [
            "witnessId",
            "predicate",
            "finalEffectsDigest",
            "targetFactsDigest",
            "safetyProfileDigest",
            "facts"
          ],
          "additionalProperties": false
        }
      ],
      "x-discriminator": "predicate",
      "x-variantKeys": [
        "COVERAGE",
        "BODY_CLEARANCE",
        "ENTRANCE_CONNECTIVITY",
        "HAZARD"
      ],
      "x-typeName": "Witness"
    },
    "Witnesses": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Witness"
      },
      "x-typeName": "Witnesses",
      "x-order": "witnessId UTF16 ascending",
      "x-uniqueBy": "witnessId"
    },
    "ValidateBuildProposalSourceError": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CAPABILITY_UNAVAILABLE"
            },
            "phase": {
              "const": "readback"
            },
            "retryability": {
              "const": "SAME_TRANSACTION_QUERY"
            },
            "mutationState": {
              "const": "UNKNOWN"
            },
            "transactionRef": {
              "const": "fixture-tx"
            },
            "causeCode": {
              "const": "APPLY_FAILED"
            },
            "reason": {
              "const": "TRANSPORT_OUTCOME_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CAPABILITY_UNAVAILABLE"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "POLICY_UNAVAILABLE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        }
      ],
      "x-authority": "C-painter carried sample value closure; actual original source closure NOT supplied"
    },
    "ValidateRegionProposalSourceError": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CAPABILITY_UNAVAILABLE"
            },
            "phase": {
              "const": "readback"
            },
            "retryability": {
              "const": "SAME_TRANSACTION_QUERY"
            },
            "mutationState": {
              "const": "UNKNOWN"
            },
            "transactionRef": {
              "const": "fixture-tx"
            },
            "causeCode": {
              "const": "APPLY_FAILED"
            },
            "reason": {
              "const": "TRANSPORT_OUTCOME_UNKNOWN"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CAPABILITY_UNAVAILABLE"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "POLICY_UNAVAILABLE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        }
      ],
      "x-authority": "C-painter carried sample value closure; actual original source closure NOT supplied"
    },
    "ImageMaterialOwnAdmissionError": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_SHAPE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "UNKNOWN_REQUIRED_FIELD"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "UNKNOWN_FIELD"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "UNSUPPORTED_VERSION"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "VERSION_UNSUPPORTED"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "LONE_SURROGATE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "decode"
            },
            "retryability": {
              "const": "NEVER"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_NUMBER"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "SCHEMA_INVALID"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_SHAPE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CURRENT_WORLD_MISMATCH"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_SHAPE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "CATALOGUE_MISMATCH"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_SHAPE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "NON_CANONICAL_AMBIGUITY"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_SHAPE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "code": {
              "const": "UNSUPPORTED_MUTATION_SEMANTICS"
            },
            "phase": {
              "const": "validate"
            },
            "retryability": {
              "const": "AFTER_NEW_FACTS"
            },
            "mutationState": {
              "const": "NONE"
            },
            "transactionRef": {
              "const": null
            },
            "causeCode": {
              "const": null
            },
            "reason": {
              "const": "INVALID_SHAPE"
            }
          },
          "required": [
            "code",
            "phase",
            "retryability",
            "mutationState",
            "transactionRef",
            "causeCode",
            "reason"
          ],
          "additionalProperties": false
        }
      ]
    },
    "IntentProjectionV5": {
      "type": "object",
      "properties": {
        "contractVersion": {
          "const": "session/v5"
        },
        "referenceBriefDigest": {
          "$ref": "#/definitions/Digest"
        },
        "confirmedIntent": {
          "$ref": "#/definitions/ConfirmedIntent"
        },
        "intendedWorldRef": {
          "$ref": "#/definitions/Ref"
        },
        "orderedTargetRefs": {
          "$ref": "#/definitions/OrderedRefs"
        }
      },
      "required": [
        "contractVersion",
        "referenceBriefDigest",
        "confirmedIntent",
        "intendedWorldRef",
        "orderedTargetRefs"
      ],
      "additionalProperties": false,
      "x-typeName": "IntentProjection"
    },
    "BriefProjectionV5": {
      "type": "object",
      "properties": {
        "contractVersion": {
          "const": "ReferenceBrief/v5"
        },
        "sessionRef": {
          "$ref": "#/definitions/Ref"
        },
        "turnRevision": {
          "$ref": "#/definitions/Revision"
        },
        "briefRevision": {
          "$ref": "#/definitions/Revision"
        },
        "media": {
          "$ref": "#/definitions/Media"
        },
        "text": {
          "$ref": "#/definitions/Text"
        },
        "controls": {
          "$ref": "#/definitions/Controls"
        }
      },
      "required": [
        "contractVersion",
        "sessionRef",
        "turnRevision",
        "briefRevision",
        "media",
        "text",
        "controls"
      ],
      "additionalProperties": false,
      "x-typeName": "BriefProjection"
    },
    "BuildProposalContextV5": {
      "type": "object",
      "properties": {
        "contractVersion": {
          "const": "painter/v6"
        },
        "sessionRef": {
          "$ref": "#/definitions/Ref"
        },
        "worldRef": {
          "$ref": "#/definitions/Ref"
        },
        "turnRevision": {
          "$ref": "#/definitions/Revision"
        },
        "painterId": {
          "const": "building-exterior"
        },
        "invocationId": {
          "$ref": "#/definitions/Ref"
        },
        "intent": {
          "$ref": "#/definitions/IntentProjectionV5"
        },
        "intentDigest": {
          "$ref": "#/definitions/Digest"
        },
        "referenceBrief": {
          "$ref": "#/definitions/BriefProjectionV5"
        },
        "referenceBriefDigest": {
          "$ref": "#/definitions/Digest"
        },
        "catalogue": {
          "$ref": "#/definitions/Catalogue"
        },
        "targetFacts": {
          "$ref": "#/definitions/TargetFacts"
        },
        "targetFactsDigest": {
          "$ref": "#/definitions/Digest"
        },
        "safetyProfile": {
          "$ref": "#/definitions/SafetyProfile"
        },
        "safetyProfileDigest": {
          "$ref": "#/definitions/Digest"
        },
        "regionInspection": {
          "$ref": "#/definitions/RegionInspection"
        },
        "localContext": {
          "$ref": "#/definitions/LocalWorldContext"
        }
      },
      "required": [
        "contractVersion",
        "sessionRef",
        "worldRef",
        "turnRevision",
        "painterId",
        "invocationId",
        "intent",
        "intentDigest",
        "referenceBrief",
        "referenceBriefDigest",
        "catalogue",
        "targetFacts",
        "targetFactsDigest",
        "safetyProfile",
        "safetyProfileDigest",
        "regionInspection",
        "localContext"
      ],
      "additionalProperties": false,
      "x-typeName": "BuildProposalContext"
    },
    "BuildProposalProviderFactsV5": {
      "x-typeName": "BuildProposalProviderFacts",
      "type": "object",
      "properties": {
        "sourceContext": {
          "$ref": "#/definitions/BuildProposalContextV5"
        },
        "currentContext": {
          "$ref": "#/definitions/BuildProposalContextV5"
        },
        "requestFacts": {
          "$ref": "#/definitions/LocalRequestFacts"
        }
      },
      "required": [
        "sourceContext",
        "currentContext",
        "requestFacts"
      ],
      "additionalProperties": false
    },
    "ValidateBuildProposalRequestV5": {
      "type": "object",
      "properties": {
        "contractVersion": {
          "const": "painter/v6"
        },
        "sessionRef": {
          "$ref": "#/definitions/Ref"
        },
        "requestId": {
          "$ref": "#/definitions/Ref"
        },
        "worldRef": {
          "$ref": "#/definitions/Ref"
        },
        "turnRevision": {
          "$ref": "#/definitions/Revision"
        },
        "painterId": {
          "const": "building-exterior"
        },
        "invocationId": {
          "$ref": "#/definitions/Ref"
        },
        "intent": {
          "$ref": "#/definitions/IntentProjectionV5"
        },
        "intentDigest": {
          "$ref": "#/definitions/Digest"
        },
        "referenceBrief": {
          "$ref": "#/definitions/BriefProjectionV5"
        },
        "referenceBriefDigest": {
          "$ref": "#/definitions/Digest"
        },
        "catalogue": {
          "$ref": "#/definitions/Catalogue"
        },
        "targetFacts": {
          "$ref": "#/definitions/TargetFacts"
        },
        "targetFactsDigest": {
          "$ref": "#/definitions/Digest"
        },
        "safetyProfile": {
          "$ref": "#/definitions/SafetyProfile"
        },
        "safetyProfileDigest": {
          "$ref": "#/definitions/Digest"
        },
        "regionInspection": {
          "$ref": "#/definitions/RegionInspection"
        },
        "proposal": {
          "$ref": "#/definitions/BuildProposal"
        },
        "localContext": {
          "$ref": "#/definitions/LocalWorldContext"
        }
      },
      "required": [
        "contractVersion",
        "sessionRef",
        "requestId",
        "worldRef",
        "turnRevision",
        "painterId",
        "invocationId",
        "intent",
        "intentDigest",
        "referenceBrief",
        "referenceBriefDigest",
        "catalogue",
        "targetFacts",
        "targetFactsDigest",
        "safetyProfile",
        "safetyProfileDigest",
        "regionInspection",
        "proposal",
        "localContext"
      ],
      "additionalProperties": false,
      "x-typeName": "ValidateBuildProposalRequest"
    },
    "ValidateRegionProposalRequestV5": {
      "x-typeName": "ValidateRegionProposalRequest",
      "type": "object",
      "properties": {
        "contractVersion": {
          "const": "painter-region/v3"
        },
        "sessionRef": {
          "$ref": "#/definitions/Ref"
        },
        "requestId": {
          "$ref": "#/definitions/Ref"
        },
        "worldRef": {
          "$ref": "#/definitions/Ref"
        },
        "turnRevision": {
          "$ref": "#/definitions/Revision"
        },
        "invocationId": {
          "$ref": "#/definitions/Ref"
        },
        "intent": {
          "$ref": "#/definitions/IntentProjectionV5"
        },
        "intentDigest": {
          "$ref": "#/definitions/Digest"
        },
        "referenceBrief": {
          "$ref": "#/definitions/BriefProjectionV5"
        },
        "referenceBriefDigest": {
          "$ref": "#/definitions/Digest"
        },
        "catalogue": {
          "$ref": "#/definitions/Catalogue"
        },
        "catalogueDigest": {
          "$ref": "#/definitions/Digest"
        },
        "proposal": {
          "$ref": "#/definitions/RegionProposal"
        },
        "localContext": {
          "$ref": "#/definitions/LocalWorldContext"
        }
      },
      "required": [
        "contractVersion",
        "sessionRef",
        "requestId",
        "worldRef",
        "turnRevision",
        "invocationId",
        "intent",
        "intentDigest",
        "referenceBrief",
        "referenceBriefDigest",
        "catalogue",
        "catalogueDigest",
        "proposal",
        "localContext"
      ],
      "additionalProperties": false
    },
    "BoolV6": {
      "type": "boolean"
    },
    "BoxV6": {
      "type": "object",
      "properties": {
        "min": {
          "$ref": "#/definitions/PositionV6"
        },
        "max": {
          "$ref": "#/definitions/PositionV6"
        }
      },
      "required": [
        "min",
        "max"
      ],
      "additionalProperties": false
    },
    "BriefProjectionV6": {
      "type": "object",
      "properties": {
        "contractVersion": {
          "const": "ReferenceBrief/v6"
        },
        "sessionRef": {
          "$ref": "#/definitions/RefV6"
        },
        "turnRevision": {
          "$ref": "#/definitions/RevisionV6"
        },
        "briefRevision": {
          "$ref": "#/definitions/RevisionV6"
        },
        "media": {
          "$ref": "#/definitions/MediaV6"
        },
        "text": {
          "$ref": "#/definitions/TextV6"
        },
        "controls": {
          "$ref": "#/definitions/ControlsV6"
        }
      },
      "required": [
        "contractVersion",
        "sessionRef",
        "turnRevision",
        "briefRevision",
        "media",
        "text",
        "controls"
      ],
      "additionalProperties": false
    },
    "BuildDimensionsV6": {
      "type": "object",
      "properties": {
        "width": {
          "$ref": "#/definitions/PositiveFiniteV6"
        },
        "height": {
          "$ref": "#/definitions/PositiveFiniteV6"
        },
        "depth": {
          "$ref": "#/definitions/PositiveFiniteV6"
        },
        "unit": {
          "$ref": "#/definitions/RefV6"
        }
      },
      "required": [
        "width",
        "height",
        "depth",
        "unit"
      ],
      "additionalProperties": false,
      "description": "Building size in whole nodes chosen by the player. Not a player or avatar size."
    },
    "ClearanceCellsV6": {
      "type": "object",
      "properties": {
        "width": {
          "$ref": "#/definitions/PositiveIntV6"
        },
        "height": {
          "$ref": "#/definitions/PositiveIntV6"
        },
        "depth": {
          "$ref": "#/definitions/PositiveIntV6"
        },
        "unit": {
          "const": "node"
        }
      },
      "required": [
        "width",
        "height",
        "depth",
        "unit"
      ],
      "additionalProperties": false,
      "description": "Building design clearance proposed by the skill and confirmed by the player. Not a measured, templated or derived player size; it does not prove that a real player fits."
    },
    "ConfirmedIntentV6": {
      "type": "object",
      "properties": {
        "kind": {
          "$ref": "#/definitions/IntentKindV6"
        },
        "text": {
          "$ref": "#/definitions/TextV6"
        },
        "purpose": {
          "anyOf": [
            {
              "$ref": "#/definitions/TextV6"
            },
            {
              "type": "null"
            }
          ]
        },
        "dimensions": {
          "anyOf": [
            {
              "$ref": "#/definitions/BuildDimensionsV6"
            },
            {
              "type": "null"
            }
          ]
        },
        "entrancePortalRefs": {
          "$ref": "#/definitions/OrderedRefsV6"
        },
        "confirmedTurnRevision": {
          "$ref": "#/definitions/RevisionV6"
        },
        "siteRules": {
          "$ref": "#/definitions/SiteRulesV6"
        },
        "placement": {
          "$ref": "#/definitions/PlacementProposalV6"
        }
      },
      "required": [
        "kind",
        "text",
        "purpose",
        "dimensions",
        "entrancePortalRefs",
        "confirmedTurnRevision",
        "siteRules"
      ],
      "additionalProperties": false
    },
    "ControlsV6": {
      "type": "object",
      "properties": {
        "purpose": {
          "anyOf": [
            {
              "$ref": "#/definitions/TextV6"
            },
            {
              "type": "null"
            }
          ]
        },
        "dimensions": {
          "anyOf": [
            {
              "$ref": "#/definitions/BuildDimensionsV6"
            },
            {
              "type": "null"
            }
          ]
        },
        "entrancePortalRefs": {
          "$ref": "#/definitions/OrderedRefsV6"
        },
        "styleText": {
          "anyOf": [
            {
              "$ref": "#/definitions/TextV6"
            },
            {
              "type": "null"
            }
          ]
        },
        "siteRules": {
          "anyOf": [
            {
              "$ref": "#/definitions/SiteRulesV6"
            },
            {
              "type": "null"
            }
          ]
        },
        "placement": {
          "$ref": "#/definitions/PlacementProposalV6"
        }
      },
      "required": [
        "purpose",
        "dimensions",
        "entrancePortalRefs",
        "styleText",
        "siteRules"
      ],
      "additionalProperties": false
    },
    "DigestV6": {
      "type": "string",
      "pattern": "^[0-9a-f]{64}$"
    },
    "HazardPolicyV6": {
      "type": "object",
      "properties": {
        "forbidLiquid": {
          "$ref": "#/definitions/BoolV6"
        },
        "maximumDamagePerSecond": {
          "$ref": "#/definitions/NonNegativeFiniteV6"
        }
      },
      "required": [
        "forbidLiquid",
        "maximumDamagePerSecond"
      ],
      "additionalProperties": false
    },
    "HostBuildIntentAuthorizationV6": {
      "type": "object",
      "properties": {
        "sessionRef": {
          "$ref": "#/definitions/RefV6"
        },
        "turnRef": {
          "$ref": "#/definitions/RefV6"
        },
        "turnRevision": {
          "$ref": "#/definitions/RevisionV6"
        },
        "localContext": {
          "anyOf": [
            {
              "$ref": "#/definitions/LocalWorldContextV6"
            },
            {
              "type": "null"
            }
          ]
        },
        "messageRef": {
          "$ref": "#/definitions/RefV6"
        },
        "messageDigest": {
          "$ref": "#/definitions/DigestV6"
        },
        "intent": {
          "$ref": "#/definitions/ConfirmedIntentV6"
        },
        "proposalDigest": {
          "$ref": "#/definitions/DigestV6"
        }
      },
      "required": [
        "sessionRef",
        "turnRef",
        "turnRevision",
        "localContext",
        "messageRef",
        "messageDigest",
        "intent",
        "proposalDigest"
      ],
      "additionalProperties": false
    },
    "IntentKindV6": {
      "enum": [
        "BUILD_STRUCTURE",
        "MODIFY_INTERIOR",
        "MODIFY_OBJECT",
        "UNDO",
        "REDO"
      ]
    },
    "IntentProjectionV6": {
      "type": "object",
      "properties": {
        "contractVersion": {
          "const": "session/v6"
        },
        "referenceBriefDigest": {
          "$ref": "#/definitions/DigestV6"
        },
        "confirmedIntent": {
          "$ref": "#/definitions/ConfirmedIntentV6"
        },
        "intendedWorldRef": {
          "$ref": "#/definitions/RefV6"
        },
        "orderedTargetRefs": {
          "$ref": "#/definitions/OrderedRefsV6"
        }
      },
      "required": [
        "contractVersion",
        "referenceBriefDigest",
        "confirmedIntent",
        "intendedWorldRef",
        "orderedTargetRefs"
      ],
      "additionalProperties": false
    },
    "LightRuleV6": {
      "type": "object",
      "properties": {
        "minimumLight": {
          "$ref": "#/definitions/UnitIntervalV6"
        },
        "sourceRevision": {
          "$ref": "#/definitions/RevisionV6"
        }
      },
      "required": [
        "minimumLight",
        "sourceRevision"
      ],
      "additionalProperties": false,
      "x-meaning": "minimumLight is normalised: 0 is the darkest and 1 the brightest light level the world source reports. The world source maps its own light scale onto it."
    },
    "LocalWorldContextV6": {
      "type": "object",
      "properties": {
        "connectionRef": {
          "$ref": "#/definitions/RefV6"
        },
        "connectionIncarnationRef": {
          "$ref": "#/definitions/RefV6"
        },
        "worldRef": {
          "$ref": "#/definitions/RefV6"
        },
        "selectionRevision": {
          "$ref": "#/definitions/RevisionV6"
        }
      },
      "required": [
        "connectionRef",
        "connectionIncarnationRef",
        "worldRef",
        "selectionRevision"
      ],
      "additionalProperties": false
    },
    "MediaV6": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/MediaBindingV6"
      },
      "x-order": "user input"
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
    "MediaTypeV6": {
      "enum": [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif"
      ]
    },
    "NonNegativeFiniteV6": {
      "type": "number",
      "minimum": 0,
      "x-finite": true
    },
    "OrderedRefsV6": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/RefV6"
      },
      "uniqueItems": true,
      "x-order": "input"
    },
    "PlacementAnchorKindV6": {
      "enum": [
        "CURRENT_VIEW",
        "PICKED_POINT"
      ]
    },
    "PlacementCellsV6": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/PositionV6"
      },
      "minItems": 1,
      "uniqueItems": true,
      "x-order": "numeric x,y,z"
    },
    "PlacementProposalV6": {
      "type": "object",
      "properties": {
        "profileVersion": {
          "const": "placement-proposal/v1"
        },
        "worldRef": {
          "$ref": "#/definitions/RefV6"
        },
        "source": {
          "$ref": "#/definitions/PlacementSourceV6"
        },
        "target": {
          "$ref": "#/definitions/PlacementTargetV6"
        }
      },
      "required": [
        "profileVersion",
        "worldRef",
        "source",
        "target"
      ],
      "additionalProperties": false
    },
    "PlacementSourceV6": {
      "type": "object",
      "properties": {
        "inspectionId": {
          "$ref": "#/definitions/RefV6"
        },
        "anchorKind": {
          "$ref": "#/definitions/PlacementAnchorKindV6"
        },
        "worldRevision": {
          "$ref": "#/definitions/RevisionV6"
        },
        "targetFactsDigest": {
          "$ref": "#/definitions/DigestV6"
        },
        "frameDigest": {
          "$ref": "#/definitions/DigestV6"
        }
      },
      "required": [
        "inspectionId",
        "anchorKind",
        "worldRevision",
        "targetFactsDigest",
        "frameDigest"
      ],
      "additionalProperties": false
    },
    "PlacementTargetV6": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "kind": {
              "const": "EXACT_CELLS"
            },
            "cells": {
              "$ref": "#/definitions/PlacementCellsV6"
            }
          },
          "required": [
            "kind",
            "cells"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "kind": {
              "const": "ANCHORED_EXTENT"
            },
            "bounds": {
              "$ref": "#/definitions/BoxV6"
            }
          },
          "required": [
            "kind",
            "bounds"
          ],
          "additionalProperties": false
        }
      ],
      "x-discriminator": "kind",
      "x-variantKeys": [
        "EXACT_CELLS",
        "ANCHORED_EXTENT"
      ]
    },
    "PositionV6": {
      "type": "array",
      "items": [
        {
          "$ref": "#/definitions/SafeIntV6"
        },
        {
          "$ref": "#/definitions/SafeIntV6"
        },
        {
          "$ref": "#/definitions/SafeIntV6"
        }
      ],
      "minItems": 3,
      "maxItems": 3,
      "additionalItems": false,
      "x-order": "x,y,z"
    },
    "PositiveFiniteV6": {
      "type": "number",
      "exclusiveMinimum": 0,
      "x-finite": true
    },
    "PositiveIntV6": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9007199254740991
    },
    "RefV6": {
      "type": "string",
      "minLength": 1,
      "x-normalization": "NONE; exact Unicode scalar sequence; never trim/lower/NFC; not a path"
    },
    "RevisionV6": {
      "type": "string",
      "minLength": 1,
      "x-normalization": "NONE; opaque equality, never numeric ordering"
    },
    "SafeIntV6": {
      "type": "integer",
      "minimum": -9007199254740991,
      "maximum": 9007199254740991
    },
    "SiteRulesV6": {
      "type": "object",
      "properties": {
        "requireEntranceConnectivity": {
          "$ref": "#/definitions/BoolV6"
        },
        "entranceClearance": {
          "anyOf": [
            {
              "$ref": "#/definitions/ClearanceCellsV6"
            },
            {
              "type": "null"
            }
          ]
        },
        "hazardPolicy": {
          "$ref": "#/definitions/HazardPolicyV6"
        },
        "optionalLightRule": {
          "anyOf": [
            {
              "$ref": "#/definitions/LightRuleV6"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "requireEntranceConnectivity",
        "entranceClearance",
        "hazardPolicy",
        "optionalLightRule"
      ],
      "additionalProperties": false
    },
    "TextV6": {
      "type": "string",
      "x-normalization": "NONE"
    },
    "UnitIntervalV6": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "ConfirmationCarrierV6": {
      "type": "object",
      "properties": {
        "authorization": {
          "$ref": "#/definitions/HostBuildIntentAuthorizationV6"
        },
        "intent": {
          "$ref": "#/definitions/IntentProjectionV6"
        },
        "referenceBrief": {
          "$ref": "#/definitions/BriefProjectionV6"
        },
        "intentDigest": {
          "$ref": "#/definitions/Digest"
        },
        "referenceBriefDigest": {
          "$ref": "#/definitions/Digest"
        }
      },
      "required": [
        "authorization",
        "intent",
        "referenceBrief",
        "intentDigest",
        "referenceBriefDigest"
      ],
      "additionalProperties": false
    },
    "ValidateBuildProposalRequestV6": {
      "type": "object",
      "properties": {
        "contractVersion": {
          "const": "painter/v6"
        },
        "sessionRef": {
          "$ref": "#/definitions/Ref"
        },
        "requestId": {
          "$ref": "#/definitions/Ref"
        },
        "worldRef": {
          "$ref": "#/definitions/Ref"
        },
        "turnRevision": {
          "$ref": "#/definitions/Revision"
        },
        "painterId": {
          "const": "building-exterior"
        },
        "invocationId": {
          "$ref": "#/definitions/Ref"
        },
        "intent": {
          "$ref": "#/definitions/IntentProjectionV6"
        },
        "intentDigest": {
          "$ref": "#/definitions/Digest"
        },
        "referenceBrief": {
          "$ref": "#/definitions/BriefProjectionV6"
        },
        "referenceBriefDigest": {
          "$ref": "#/definitions/Digest"
        },
        "catalogue": {
          "$ref": "#/definitions/Catalogue"
        },
        "targetFacts": {
          "$ref": "#/definitions/TargetFacts"
        },
        "targetFactsDigest": {
          "$ref": "#/definitions/Digest"
        },
        "safetyProfile": {
          "$ref": "#/definitions/SafetyProfile"
        },
        "safetyProfileDigest": {
          "$ref": "#/definitions/Digest"
        },
        "regionInspection": {
          "$ref": "#/definitions/RegionInspection"
        },
        "proposal": {
          "$ref": "#/definitions/BuildProposal"
        },
        "localContext": {
          "$ref": "#/definitions/LocalWorldContext"
        },
        "confirmation": {
          "$ref": "#/definitions/ConfirmationCarrierV6"
        }
      },
      "required": [
        "contractVersion",
        "sessionRef",
        "requestId",
        "worldRef",
        "turnRevision",
        "painterId",
        "invocationId",
        "intent",
        "intentDigest",
        "referenceBrief",
        "referenceBriefDigest",
        "catalogue",
        "targetFacts",
        "targetFactsDigest",
        "safetyProfile",
        "safetyProfileDigest",
        "regionInspection",
        "proposal",
        "localContext",
        "confirmation"
      ],
      "additionalProperties": false,
      "x-typeName": "ValidateBuildProposalRequestV6"
    },
    "BuildProposalContextV6": {
      "type": "object",
      "properties": {
        "contractVersion": {
          "const": "painter/v6"
        },
        "sessionRef": {
          "$ref": "#/definitions/Ref"
        },
        "worldRef": {
          "$ref": "#/definitions/Ref"
        },
        "turnRevision": {
          "$ref": "#/definitions/Revision"
        },
        "painterId": {
          "const": "building-exterior"
        },
        "invocationId": {
          "$ref": "#/definitions/Ref"
        },
        "intent": {
          "$ref": "#/definitions/IntentProjectionV6"
        },
        "intentDigest": {
          "$ref": "#/definitions/Digest"
        },
        "referenceBrief": {
          "$ref": "#/definitions/BriefProjectionV6"
        },
        "referenceBriefDigest": {
          "$ref": "#/definitions/Digest"
        },
        "catalogue": {
          "$ref": "#/definitions/Catalogue"
        },
        "targetFacts": {
          "$ref": "#/definitions/TargetFacts"
        },
        "targetFactsDigest": {
          "$ref": "#/definitions/Digest"
        },
        "safetyProfile": {
          "$ref": "#/definitions/SafetyProfile"
        },
        "safetyProfileDigest": {
          "$ref": "#/definitions/Digest"
        },
        "regionInspection": {
          "$ref": "#/definitions/RegionInspection"
        },
        "localContext": {
          "$ref": "#/definitions/LocalWorldContext"
        },
        "confirmation": {
          "$ref": "#/definitions/ConfirmationCarrierV6"
        }
      },
      "required": [
        "contractVersion",
        "sessionRef",
        "worldRef",
        "turnRevision",
        "painterId",
        "invocationId",
        "intent",
        "intentDigest",
        "referenceBrief",
        "referenceBriefDigest",
        "catalogue",
        "targetFacts",
        "targetFactsDigest",
        "safetyProfile",
        "safetyProfileDigest",
        "regionInspection",
        "localContext",
        "confirmation"
      ],
      "additionalProperties": false,
      "x-typeName": "BuildProposalContextV6"
    },
    "BuildProposalProviderFactsV6": {
      "type": "object",
      "properties": {
        "sourceContext": {
          "$ref": "#/definitions/BuildProposalContextV6"
        },
        "currentContext": {
          "$ref": "#/definitions/BuildProposalContextV6"
        },
        "requestFacts": {
          "$ref": "#/definitions/LocalRequestFacts"
        },
        "currentConfirmation": {
          "anyOf": [
            {
              "$ref": "#/definitions/ConfirmationCarrierV6"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "sourceContext",
        "currentContext",
        "requestFacts",
        "currentConfirmation"
      ],
      "additionalProperties": false
    },
    "ValidateRegionProposalRequestV6": {
      "x-typeName": "ValidateRegionProposalRequestV6",
      "type": "object",
      "properties": {
        "contractVersion": {
          "const": "painter-region/v3"
        },
        "sessionRef": {
          "$ref": "#/definitions/Ref"
        },
        "requestId": {
          "$ref": "#/definitions/Ref"
        },
        "worldRef": {
          "$ref": "#/definitions/Ref"
        },
        "turnRevision": {
          "$ref": "#/definitions/Revision"
        },
        "invocationId": {
          "$ref": "#/definitions/Ref"
        },
        "intent": {
          "$ref": "#/definitions/IntentProjectionV6"
        },
        "intentDigest": {
          "$ref": "#/definitions/Digest"
        },
        "referenceBrief": {
          "$ref": "#/definitions/BriefProjectionV6"
        },
        "referenceBriefDigest": {
          "$ref": "#/definitions/Digest"
        },
        "catalogue": {
          "$ref": "#/definitions/Catalogue"
        },
        "catalogueDigest": {
          "$ref": "#/definitions/Digest"
        },
        "proposal": {
          "$ref": "#/definitions/RegionProposal"
        },
        "localContext": {
          "$ref": "#/definitions/LocalWorldContext"
        },
        "confirmation": {
          "$ref": "#/definitions/ConfirmationCarrierV6"
        }
      },
      "required": [
        "contractVersion",
        "sessionRef",
        "requestId",
        "worldRef",
        "turnRevision",
        "invocationId",
        "intent",
        "intentDigest",
        "referenceBrief",
        "referenceBriefDigest",
        "catalogue",
        "catalogueDigest",
        "proposal",
        "localContext",
        "confirmation"
      ],
      "additionalProperties": false
    },
    "RegionProposalContextV6": {
      "x-typeName": "RegionProposalContextV6",
      "type": "object",
      "properties": {
        "contractVersion": {
          "const": "painter-region/v3"
        },
        "sessionRef": {
          "$ref": "#/definitions/Ref"
        },
        "worldRef": {
          "$ref": "#/definitions/Ref"
        },
        "turnRevision": {
          "$ref": "#/definitions/Revision"
        },
        "invocationId": {
          "$ref": "#/definitions/Ref"
        },
        "intent": {
          "$ref": "#/definitions/IntentProjectionV6"
        },
        "intentDigest": {
          "$ref": "#/definitions/Digest"
        },
        "referenceBrief": {
          "$ref": "#/definitions/BriefProjectionV6"
        },
        "referenceBriefDigest": {
          "$ref": "#/definitions/Digest"
        },
        "catalogue": {
          "$ref": "#/definitions/Catalogue"
        },
        "catalogueDigest": {
          "$ref": "#/definitions/Digest"
        },
        "localContext": {
          "$ref": "#/definitions/LocalWorldContext"
        },
        "confirmation": {
          "$ref": "#/definitions/ConfirmationCarrierV6"
        }
      },
      "required": [
        "contractVersion",
        "sessionRef",
        "worldRef",
        "turnRevision",
        "invocationId",
        "intent",
        "intentDigest",
        "referenceBrief",
        "referenceBriefDigest",
        "catalogue",
        "catalogueDigest",
        "localContext",
        "confirmation"
      ],
      "additionalProperties": false
    },
    "RegionProposalProviderFactsV6": {
      "type": "object",
      "properties": {
        "sourceContext": {
          "$ref": "#/definitions/RegionProposalContextV6"
        },
        "currentContext": {
          "$ref": "#/definitions/RegionProposalContextV6"
        },
        "requestFacts": {
          "$ref": "#/definitions/LocalRequestFacts"
        },
        "currentConfirmation": {
          "anyOf": [
            {
              "$ref": "#/definitions/ConfirmationCarrierV6"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "sourceContext",
        "currentContext",
        "requestFacts",
        "currentConfirmation"
      ],
      "additionalProperties": false
    },
    "RegionProposalProviderFacts": {
      "oneOf": [
        {
          "$ref": "#/definitions/LocalRequestFacts"
        },
        {
          "$ref": "#/definitions/RegionProposalProviderFactsV6"
        }
      ]
    }
  },
  "digest": {
    "algorithm": "RFC8785 canonical JSON + SHA256",
    "domainSuffix": "|",
    "prefixes": {
      "build": "HanaWorlds|contracts@0.4.0|",
      "reference-brief": "HanaWorlds|contracts@0.4.0|",
      "intent": "HanaWorlds|contracts@0.4.0|",
      "frame": "HanaWorlds|contracts@0.4.0|",
      "catalogue": "HanaWorlds|contracts@0.4.0|",
      "safety-profile": "HanaWorlds|contracts@0.4.0|",
      "final-effects": "HanaWorlds|contracts@0.4.0|",
      "target-facts": "HanaWorlds|contracts@0.4.0|",
      "material-sources": "HanaWorlds|material-sources/v2|",
      "region-build": "HanaWorlds|region-voxels/v2|"
    },
    "projectionTypes": {
      "build": "BuildProjection",
      "reference-brief": "BriefProjection",
      "intent": "IntentProjection",
      "frame": "Frame",
      "catalogue": "Catalogue",
      "safety-profile": "SafetyProfile",
      "final-effects": "FinalEffects",
      "target-facts": "TargetFacts",
      "material-sources": "MaterialSourcesProjection",
      "region-build": "RegionBuildProjection"
    }
  },
  "operationErrors": {
    "ValidateBuildProposal": {
      "own": [
        {
          "id": "ValidateBuildProposal-0",
          "stage": "decode",
          "origin": "owned strict request decoder",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_UTF8"
          }
        },
        {
          "id": "ValidateBuildProposal-1",
          "stage": "decode",
          "origin": "owned strict request decoder",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "DUPLICATE_DECODED_KEY"
          }
        },
        {
          "id": "ValidateBuildProposal-2",
          "stage": "decode",
          "origin": "owned strict request decoder",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "LONE_SURROGATE"
          }
        },
        {
          "id": "ValidateBuildProposal-3",
          "stage": "decode",
          "origin": "owned strict request decoder",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_NUMBER"
          }
        },
        {
          "id": "ValidateBuildProposal-4",
          "stage": "decode",
          "origin": "owned strict request decoder",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        },
        {
          "id": "ValidateBuildProposal-6",
          "stage": "validate",
          "origin": "src/local-context.mjs / src/region-proposal.mjs and owned admission",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        },
        {
          "id": "ValidateBuildProposal-8",
          "stage": "validate",
          "origin": "src/local-context.mjs / src/region-proposal.mjs and owned admission",
          "value": {
            "code": "INTENT_UNCONFIRMED",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REQUIRED_FACT_UNKNOWN"
          }
        },
        {
          "id": "ValidateBuildProposal-9",
          "stage": "validate",
          "origin": "src/local-context.mjs / src/region-proposal.mjs and owned admission",
          "value": {
            "code": "CURRENT_WORLD_MISMATCH",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REVISION_CHANGED"
          }
        },
        {
          "id": "ValidateBuildProposal-10",
          "stage": "validate",
          "origin": "src/local-context.mjs / src/region-proposal.mjs and owned admission",
          "value": {
            "code": "REQUEST_CANCELLED",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REVISION_CHANGED"
          }
        },
        {
          "id": "ValidateBuildProposal-11",
          "stage": "validate",
          "origin": "src/local-context.mjs / src/region-proposal.mjs and owned admission",
          "value": {
            "code": "CAPABILITY_UNAVAILABLE",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "POLICY_UNAVAILABLE"
          }
        },
        {
          "id": "ValidateBuildProposal-12",
          "stage": "validate",
          "origin": "src/local-context.mjs / src/region-proposal.mjs and owned admission",
          "value": {
            "code": "REQUEST_NOT_ACTIVE",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REQUIRED_FACT_UNKNOWN"
          }
        },
        {
          "id": "ValidateBuildProposal-13",
          "stage": "replay",
          "origin": "owned ephemeral receipt",
          "value": {
            "code": "REPLAY_MISMATCH",
            "phase": "replay",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "PAYLOAD_CHANGED"
          }
        },
        {
          "id": "ValidateBuildProposal-14",
          "stage": "validate",
          "origin": "src/local-context.mjs / src/region-proposal.mjs and owned admission",
          "value": {
            "code": "INTENT_UNCONFIRMED",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "PAYLOAD_CHANGED"
          }
        },
        {
          "id": "ValidateBuildProposal-15",
          "stage": "validate",
          "origin": "src/planner.mjs",
          "value": {
            "code": "BUILD_INVALID",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        },
        {
          "id": "ValidateBuildProposal-16",
          "stage": "validate",
          "origin": "src/planner.mjs",
          "value": {
            "code": "BUILD_INVALID",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_GEOMETRY"
          }
        },
        {
          "id": "ValidateBuildProposal-17",
          "stage": "validate",
          "origin": "src/planner.mjs",
          "value": {
            "code": "UNSUPPORTED_MATERIAL",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "CATALOGUE_UNRESOLVED"
          }
        },
        {
          "id": "ValidateBuildProposal-18",
          "stage": "validate",
          "origin": "src/planner.mjs",
          "value": {
            "code": "UNSUPPORTED_MATERIAL",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REQUIRED_FACT_UNKNOWN"
          }
        },
        {
          "id": "ValidateBuildProposal-19",
          "stage": "validate",
          "origin": "src/planner.mjs",
          "value": {
            "code": "TARGET_FACTS_INCOMPLETE",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REQUIRED_FACT_UNKNOWN"
          }
        },
        {
          "id": "ValidateBuildProposal-20",
          "stage": "validate",
          "origin": "src/local-context.mjs / src/region-proposal.mjs and owned admission",
          "value": {
            "code": "TARGET_FACTS_STALE",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REVISION_CHANGED"
          }
        },
        {
          "id": "ValidateBuildProposal-owned-admission-19",
          "stage": "decode",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "UNKNOWN_REQUIRED_FIELD",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "UNKNOWN_FIELD"
          }
        },
        {
          "id": "ValidateBuildProposal-owned-admission-20",
          "stage": "decode",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "UNSUPPORTED_VERSION",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "VERSION_UNSUPPORTED"
          }
        },
        {
          "id": "ValidateBuildProposal-owned-admission-21",
          "stage": "validate",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_GEOMETRY"
          }
        },
        {
          "id": "original-v2-safety-refusal",
          "stage": "validate",
          "origin": "original proposal-errors-v2.test.mjs safety mutation; authored complete values, not real world/authorization",
          "value": {
            "code": "SAFETY_INVARIANT_FAILED",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REQUIRED_FACT_UNKNOWN"
          }
        },
        {
          "id": "ValidateBuildProposal-q247-0",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "build-current-currentTurnRevision-read1",
            "build-current-currentTurnRevision-read2",
            "q247-path-ValidateBuildProposal-current-turn-1",
            "q247-path-ValidateBuildProposal-current-turn-2"
          ],
          "value": {
            "code": "TURN_REVISION_MISMATCH",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REVISION_CHANGED"
          }
        },
        {
          "id": "ValidateBuildProposal-q247-1",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "build-current-currentBriefDigest-read1",
            "build-current-sessionRef-read1",
            "build-current-requestState-read1",
            "build-current-replay-read1",
            "build-current-priorRequestDigest-read1",
            "build-current-currentBriefDigest-read2",
            "build-current-sessionRef-read2",
            "build-current-requestState-read2",
            "build-current-replay-read2",
            "build-current-priorRequestDigest-read2",
            "q247-path-ValidateBuildProposal-replay-conflict-1",
            "q247-path-ValidateBuildProposal-replay-exact-1",
            "q247-path-ValidateBuildProposal-prior-digest-1",
            "q247-path-ValidateBuildProposal-replay-conflict-2",
            "q247-path-ValidateBuildProposal-replay-exact-2",
            "q247-path-ValidateBuildProposal-prior-digest-2",
            "q247-path-ValidateBuildProposal-current-brief-1",
            "q247-path-ValidateBuildProposal-current-session-1",
            "q247-path-ValidateBuildProposal-current-completed-1",
            "q247-path-ValidateBuildProposal-current-brief-2",
            "q247-path-ValidateBuildProposal-current-session-2",
            "q247-path-ValidateBuildProposal-current-completed-2"
          ],
          "value": {
            "code": "TRANSACTION_CONFLICT",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "PAYLOAD_CHANGED"
          }
        },
        {
          "id": "ValidateBuildProposal-q247-2",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-ValidateBuildProposal-unknown-material"
          ],
          "value": {
            "code": "CATALOGUE_MISMATCH",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "CATALOGUE_UNRESOLVED"
          }
        },
        {
          "id": "ValidateBuildProposal-q247-3",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-ValidateBuildProposal-orientation",
            "q247-path-ValidateBuildProposal-placeable",
            "q247-path-ValidateBuildProposal-unknown-orientation"
          ],
          "value": {
            "code": "UNSUPPORTED_MUTATION_SEMANTICS",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REQUIRED_FACT_UNKNOWN"
          }
        },
        {
          "id": "ValidateBuildProposal-q247-4",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-ValidateBuildProposal-placement-binding"
          ],
          "value": {
            "code": "INTENT_UNCONFIRMED",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "IDENTITY_UNVERIFIED"
          }
        },
        {
          "id": "ValidateBuildProposal-q247-5",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-ValidateBuildProposal-placement-world"
          ],
          "value": {
            "code": "CURRENT_WORLD_MISMATCH",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "SCOPE_DENIED"
          }
        },
        {
          "id": "ValidateBuildProposal-q247-6",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-ValidateBuildProposal-placement-frame"
          ],
          "value": {
            "code": "INVALID_FRAME",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "PAYLOAD_CHANGED"
          }
        },
        {
          "id": "ValidateBuildProposal-q247-7",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-ValidateBuildProposal-placement-inspection"
          ],
          "value": {
            "code": "TARGET_FACTS_STALE",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "PAYLOAD_CHANGED"
          }
        },
        {
          "id": "ValidateBuildProposal-q247-8",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-ValidateBuildProposal-placement-target"
          ],
          "value": {
            "code": "INTENT_UNCONFIRMED",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_GEOMETRY"
          }
        },
        {
          "id": "ValidateBuildProposal-q247-9",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-ValidateBuildProposal-light-rule"
          ],
          "value": {
            "code": "CAPABILITY_UNAVAILABLE",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REQUIRED_FACT_UNKNOWN"
          }
        },
        {
          "id": "ValidateBuildProposal-q256-NON_CANONICAL_AMBIGUITY",
          "stage": "validate",
          "origin": "Preserved own public Painter 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "ValidateBuildProposal-intentDigest",
            "ValidateBuildProposal-targetFactsDigest",
            "ValidateBuildProposal-safetyProfileDigest",
            "original-site-rule-old-intent-digest"
          ],
          "value": {
            "code": "NON_CANONICAL_AMBIGUITY",
            "phase": "validate",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "PAYLOAD_CHANGED"
          }
        },
        {
          "id": "ValidateBuildProposal-q256-MEDIA_DIGEST_MISMATCH",
          "stage": "validate",
          "origin": "Preserved own public Painter 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "ValidateBuildProposal-referenceBriefDigest",
            "ValidateBuildProposal-coherent-bad-brief-digest"
          ],
          "value": {
            "code": "MEDIA_DIGEST_MISMATCH",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "PAYLOAD_CHANGED"
          }
        }
      ],
      "sourceStages": [
        "first facts read",
        "second facts read",
        "replay independent readback"
      ],
      "sourceType": "ValidateBuildProposalSourceError",
      "opaque": "throw original nonserializable source object unchanged; no constructed Error is proof",
      "v2Codes": [
        "SAFETY_INVARIANT_FAILED",
        "INTENT_UNCONFIRMED",
        "TARGET_FACTS_STALE",
        "SCHEMA_INVALID"
      ],
      "proposedCodes": [
        "SCHEMA_INVALID",
        "INTENT_UNCONFIRMED",
        "CURRENT_WORLD_MISMATCH",
        "REQUEST_CANCELLED",
        "CAPABILITY_UNAVAILABLE",
        "REQUEST_NOT_ACTIVE",
        "REPLAY_MISMATCH",
        "BUILD_INVALID",
        "UNSUPPORTED_MATERIAL",
        "TARGET_FACTS_INCOMPLETE",
        "TARGET_FACTS_STALE",
        "UNKNOWN_REQUIRED_FIELD",
        "UNSUPPORTED_VERSION",
        "SAFETY_INVARIANT_FAILED"
      ],
      "pendingAdmissionBranches": [
        "All original admission/safety gates retained and exercised at public entry; implementation still pending review, not a document consumption precondition."
      ],
      "status": "COMPLETE_OWN_STAGE_SET_WITH_EXACT_DOCUMENT_CARRIED_SAMPLES_REAL_SOURCE_EXHAUSTIVENESS_JOURNEY_PENDING"
    },
    "ValidateRegionProposal": {
      "own": [
        {
          "id": "ValidateRegionProposal-0",
          "stage": "decode",
          "origin": "owned strict request decoder",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_UTF8"
          }
        },
        {
          "id": "ValidateRegionProposal-1",
          "stage": "decode",
          "origin": "owned strict request decoder",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "DUPLICATE_DECODED_KEY"
          }
        },
        {
          "id": "ValidateRegionProposal-2",
          "stage": "decode",
          "origin": "owned strict request decoder",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "LONE_SURROGATE"
          }
        },
        {
          "id": "ValidateRegionProposal-3",
          "stage": "decode",
          "origin": "owned strict request decoder",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_NUMBER"
          }
        },
        {
          "id": "ValidateRegionProposal-4",
          "stage": "decode",
          "origin": "owned strict request decoder",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        },
        {
          "id": "ValidateRegionProposal-6",
          "stage": "validate",
          "origin": "src/local-context.mjs / src/region-proposal.mjs and owned admission",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        },
        {
          "id": "ValidateRegionProposal-8",
          "stage": "validate",
          "origin": "src/local-context.mjs / src/region-proposal.mjs and owned admission",
          "value": {
            "code": "INTENT_UNCONFIRMED",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REQUIRED_FACT_UNKNOWN"
          }
        },
        {
          "id": "ValidateRegionProposal-9",
          "stage": "validate",
          "origin": "src/local-context.mjs / src/region-proposal.mjs and owned admission",
          "value": {
            "code": "CURRENT_WORLD_MISMATCH",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REVISION_CHANGED"
          }
        },
        {
          "id": "ValidateRegionProposal-10",
          "stage": "validate",
          "origin": "src/local-context.mjs / src/region-proposal.mjs and owned admission",
          "value": {
            "code": "REQUEST_CANCELLED",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REVISION_CHANGED"
          }
        },
        {
          "id": "ValidateRegionProposal-11",
          "stage": "validate",
          "origin": "src/local-context.mjs / src/region-proposal.mjs and owned admission",
          "value": {
            "code": "CAPABILITY_UNAVAILABLE",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "POLICY_UNAVAILABLE"
          }
        },
        {
          "id": "ValidateRegionProposal-12",
          "stage": "validate",
          "origin": "src/local-context.mjs / src/region-proposal.mjs and owned admission",
          "value": {
            "code": "REQUEST_NOT_ACTIVE",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REQUIRED_FACT_UNKNOWN"
          }
        },
        {
          "id": "ValidateRegionProposal-13",
          "stage": "replay",
          "origin": "owned ephemeral receipt",
          "value": {
            "code": "REPLAY_MISMATCH",
            "phase": "replay",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "PAYLOAD_CHANGED"
          }
        },
        {
          "id": "ValidateRegionProposal-owned-admission-12",
          "stage": "decode",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "UNKNOWN_REQUIRED_FIELD",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "UNKNOWN_FIELD"
          }
        },
        {
          "id": "ValidateRegionProposal-owned-admission-13",
          "stage": "decode",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "UNSUPPORTED_VERSION",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "VERSION_UNSUPPORTED"
          }
        },
        {
          "id": "ValidateRegionProposal-owned-admission-14",
          "stage": "validate",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_GEOMETRY"
          }
        },
        {
          "id": "ValidateRegionProposal-q247-0",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-unknown-material",
            "q247-empty-material-missing",
            "q247-path-ValidateRegionProposal-unknown-material"
          ],
          "value": {
            "code": "CATALOGUE_MISMATCH",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "CATALOGUE_UNRESOLVED"
          }
        },
        {
          "id": "ValidateRegionProposal-q247-1",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-orientation",
            "q247-stateful",
            "q247-opaque-empty-orientation",
            "q247-path-ValidateRegionProposal-orientation",
            "q247-path-ValidateRegionProposal-placeable",
            "q247-path-ValidateRegionProposal-unknown-orientation"
          ],
          "value": {
            "code": "UNSUPPORTED_MUTATION_SEMANTICS",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REQUIRED_FACT_UNKNOWN"
          }
        },
        {
          "id": "ValidateRegionProposal-q247-2",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-media-brief-read1",
            "q247-currentBriefDigest-read1",
            "q247-sessionRef-read1",
            "q247-state-COMPLETED-read1",
            "q247-media-brief-read2",
            "q247-currentBriefDigest-read2",
            "q247-sessionRef-read2",
            "q247-state-COMPLETED-read2",
            "q247-path-ValidateRegionProposal-replay-conflict-1",
            "q247-path-ValidateRegionProposal-replay-exact-1",
            "q247-path-ValidateRegionProposal-prior-digest-1",
            "q247-path-ValidateRegionProposal-replay-conflict-2",
            "q247-path-ValidateRegionProposal-replay-exact-2",
            "q247-path-ValidateRegionProposal-prior-digest-2",
            "q247-path-ValidateRegionProposal-current-brief-1",
            "q247-path-ValidateRegionProposal-current-session-1",
            "q247-path-ValidateRegionProposal-current-completed-1",
            "q247-path-ValidateRegionProposal-current-brief-2",
            "q247-path-ValidateRegionProposal-current-session-2",
            "q247-path-ValidateRegionProposal-current-completed-2"
          ],
          "value": {
            "code": "TRANSACTION_CONFLICT",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "PAYLOAD_CHANGED"
          }
        },
        {
          "id": "ValidateRegionProposal-q247-3",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-currentTurnRevision-read1",
            "q247-currentTurnRevision-read2",
            "q247-path-ValidateRegionProposal-current-turn-1",
            "q247-path-ValidateRegionProposal-current-turn-2"
          ],
          "value": {
            "code": "TURN_REVISION_MISMATCH",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REVISION_CHANGED"
          }
        },
        {
          "id": "ValidateRegionProposal-q247-4",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-ValidateRegionProposal-liquid-unknown"
          ],
          "value": {
            "code": "UNSUPPORTED_MATERIAL",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REQUIRED_FACT_UNKNOWN"
          }
        },
        {
          "id": "ValidateRegionProposal-q247-5",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-ValidateRegionProposal-liquid-forbidden",
            "q247-path-ValidateRegionProposal-hazard-forbidden"
          ],
          "value": {
            "code": "SAFETY_INVARIANT_FAILED",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REQUIRED_FACT_UNKNOWN"
          }
        },
        {
          "id": "ValidateRegionProposal-q247-6",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-ValidateRegionProposal-placement-binding"
          ],
          "value": {
            "code": "INTENT_UNCONFIRMED",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "IDENTITY_UNVERIFIED"
          }
        },
        {
          "id": "ValidateRegionProposal-q247-7",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-ValidateRegionProposal-placement-world"
          ],
          "value": {
            "code": "CURRENT_WORLD_MISMATCH",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "SCOPE_DENIED"
          }
        },
        {
          "id": "ValidateRegionProposal-q247-8",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-ValidateRegionProposal-placement-target"
          ],
          "value": {
            "code": "INTENT_UNCONFIRMED",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_GEOMETRY"
          }
        },
        {
          "id": "ValidateRegionProposal-q247-9",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-ValidateRegionProposal-light-rule",
            "q247-path-ValidateRegionProposal-entrance-rule"
          ],
          "value": {
            "code": "CAPABILITY_UNAVAILABLE",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "REQUIRED_FACT_UNKNOWN"
          }
        },
        {
          "id": "ValidateRegionProposal-q256-NON_CANONICAL_AMBIGUITY",
          "stage": "validate",
          "origin": "Preserved own public Painter 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "ValidateRegionProposal-intentDigest",
            "ValidateRegionProposal-catalogueDigest"
          ],
          "value": {
            "code": "NON_CANONICAL_AMBIGUITY",
            "phase": "validate",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "PAYLOAD_CHANGED"
          }
        },
        {
          "id": "ValidateRegionProposal-q256-MEDIA_DIGEST_MISMATCH",
          "stage": "validate",
          "origin": "Preserved own public Painter 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "ValidateRegionProposal-coherent-bad-brief-digest"
          ],
          "value": {
            "code": "MEDIA_DIGEST_MISMATCH",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "PAYLOAD_CHANGED"
          }
        }
      ],
      "sourceStages": [
        "first facts read",
        "second facts read",
        "replay independent readback"
      ],
      "sourceType": "ValidateRegionProposalSourceError",
      "opaque": "throw original nonserializable source object unchanged; no constructed Error is proof",
      "v2Codes": [
        "SAFETY_INVARIANT_FAILED",
        "INTENT_UNCONFIRMED",
        "SCHEMA_INVALID"
      ],
      "proposedCodes": [
        "SCHEMA_INVALID",
        "INTENT_UNCONFIRMED",
        "CURRENT_WORLD_MISMATCH",
        "REQUEST_CANCELLED",
        "CAPABILITY_UNAVAILABLE",
        "REQUEST_NOT_ACTIVE",
        "REPLAY_MISMATCH",
        "UNKNOWN_REQUIRED_FIELD",
        "UNSUPPORTED_VERSION"
      ],
      "pendingAdmissionBranches": [
        "All original admission/safety gates retained and exercised at public entry; implementation still pending review, not a document consumption precondition."
      ],
      "status": "COMPLETE_OWN_STAGE_SET_WITH_EXACT_DOCUMENT_CARRIED_SAMPLES_REAL_SOURCE_EXHAUSTIVENESS_JOURNEY_PENDING"
    },
    "hanaworlds_image_material": {
      "stageOrder": [
        "strict root/typed bytes and copied material facts admission",
        "KNOWN/static eligibility",
        "main raster",
        "KNOWN texture raster/media consistency",
        "CIEDE2000 result correlation"
      ],
      "errors": [
        {
          "stage": "root/material fact admission",
          "form": "original seven-field owned admission error; same complete correlated self rows, no constructor singleton requirement"
        },
        {
          "stage": "missing/no KNOWN legal source",
          "code": "CAPABILITY_UNAVAILABLE",
          "name": "ImageMaterialError",
          "mutationState": "NONE",
          "messages": [
            "Current world-source material facts are unavailable; supply ReadMaterialSources before matching.",
            "No KNOWN static-legal texture variant in current source ${sourceRevision}; ${unknownVariants} texture UNKNOWN, ${staticIneligibleVariants} static-ineligible. Unknown facts remain unknown."
          ]
        },
        {
          "stage": "main bytes",
          "code": "IMAGE_REQUIRED",
          "name": "ImageMaterialError",
          "mutationState": "NONE",
          "message": "Actual non-empty image Uint8Array bytes are required."
        },
        {
          "stage": "main bytes budget",
          "code": "IMAGE_LIMIT_EXCEEDED",
          "name": "ImageMaterialError",
          "mutationState": "NONE",
          "message": "Image exceeds the visible maxBytes limit."
        },
        {
          "stage": "main raster",
          "code": "IMAGE_DECODE_FAILED",
          "name": "ImageMaterialError",
          "mutationState": "NONE",
          "messages": [
            "Only PNG/JPEG/WebP raster bytes are accepted.",
            "A single PNG/JPEG/WebP frame is required.",
            "Decoded sRGB RGBA pixels are required.",
            "Raster decoding failed; no colour was inferred."
          ]
        },
        {
          "stage": "main visible pixels",
          "code": "NO_VISIBLE_PIXELS",
          "name": "ImageMaterialError",
          "mutationState": "NONE",
          "message": "No non-transparent pixels have a colour."
        },
        {
          "stage": "KNOWN texture",
          "code": "MATERIAL_TEXTURE_UNAVAILABLE",
          "name": "ImageMaterialError",
          "mutationState": "NONE",
          "innerCodes": [
            "IMAGE_REQUIRED",
            "IMAGE_LIMIT_EXCEEDED",
            "IMAGE_DECODE_FAILED",
            "NO_VISIBLE_PIXELS"
          ],
          "message": "Current source ${sourceRevision} texture ${bytesDigest} cannot be measured (${originalImageCode}); no colour was inferred."
        }
      ],
      "ordinaryExceptions": "original object unchanged; no error wrapper or serialized identity",
      "v2Codes": [
        "CAPABILITY_UNAVAILABLE"
      ],
      "status": "OWN_CANDIDATE_FACT_AUTHORITY_PENDING",
      "ownAdmission": [
        {
          "id": "image-owned-admission-0",
          "stage": "decode",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        },
        {
          "id": "image-owned-admission-1",
          "stage": "decode",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "UNKNOWN_REQUIRED_FIELD",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "UNKNOWN_FIELD"
          }
        },
        {
          "id": "image-owned-admission-2",
          "stage": "decode",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "UNSUPPORTED_VERSION",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "VERSION_UNSUPPORTED"
          }
        },
        {
          "id": "image-owned-admission-3",
          "stage": "decode",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "LONE_SURROGATE"
          }
        },
        {
          "id": "image-owned-admission-4",
          "stage": "decode",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_NUMBER"
          }
        },
        {
          "id": "image-owned-admission-5",
          "stage": "validate",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        },
        {
          "id": "hanaworlds_image_material-q247-0",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-image-currentConnection"
          ],
          "value": {
            "code": "CURRENT_WORLD_MISMATCH",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        },
        {
          "id": "hanaworlds_image_material-q247-1",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-image-catalogueDigest",
            "q247-path-image-engineRevisions",
            "q247-path-image-definitionRevision"
          ],
          "value": {
            "code": "CATALOGUE_MISMATCH",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        },
        {
          "id": "hanaworlds_image_material-q247-2",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-image-sourceRevision",
            "q247-path-image-textureDigest",
            "q247-path-image-textureLength"
          ],
          "value": {
            "code": "NON_CANONICAL_AMBIGUITY",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        },
        {
          "id": "hanaworlds_image_material-q247-3",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-image-orientation"
          ],
          "value": {
            "code": "UNSUPPORTED_MUTATION_SEMANTICS",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        }
      ],
      "own": [
        {
          "id": "image-owned-admission-0",
          "stage": "decode",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        },
        {
          "id": "image-owned-admission-1",
          "stage": "decode",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "UNKNOWN_REQUIRED_FIELD",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "UNKNOWN_FIELD"
          }
        },
        {
          "id": "image-owned-admission-2",
          "stage": "decode",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "UNSUPPORTED_VERSION",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "VERSION_UNSUPPORTED"
          }
        },
        {
          "id": "image-owned-admission-3",
          "stage": "decode",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "LONE_SURROGATE"
          }
        },
        {
          "id": "image-owned-admission-4",
          "stage": "decode",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "decode",
            "retryability": "NEVER",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_NUMBER"
          }
        },
        {
          "id": "image-owned-admission-5",
          "stage": "validate",
          "origin": "Actual historical provider-owned admission over authored value mutation; not original source error supply",
          "value": {
            "code": "SCHEMA_INVALID",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        },
        {
          "id": "hanaworlds_image_material-q247-0",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-image-currentConnection"
          ],
          "value": {
            "code": "CURRENT_WORLD_MISMATCH",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        },
        {
          "id": "hanaworlds_image_material-q247-1",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-image-catalogueDigest",
            "q247-path-image-engineRevisions",
            "q247-path-image-definitionRevision"
          ],
          "value": {
            "code": "CATALOGUE_MISMATCH",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        },
        {
          "id": "hanaworlds_image_material-q247-2",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-image-sourceRevision",
            "q247-path-image-textureDigest",
            "q247-path-image-textureLength"
          ],
          "value": {
            "code": "NON_CANONICAL_AMBIGUITY",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        },
        {
          "id": "hanaworlds_image_material-q247-3",
          "stage": "validate",
          "origin": "Observed preserved Painter public entry 3a3bbc332b4ec7eea051fc069b0b15a58074cb47de9902d0b6997abbc7d799d2",
          "evidenceCases": [
            "q247-path-image-orientation"
          ],
          "value": {
            "code": "UNSUPPORTED_MUTATION_SEMANTICS",
            "phase": "validate",
            "retryability": "AFTER_NEW_FACTS",
            "mutationState": "NONE",
            "transactionRef": null,
            "causeCode": null,
            "reason": "INVALID_SHAPE"
          }
        }
      ]
    }
  },
  "sourceErrorAdmission": {
    "status": "C_PAINTER_DOCUMENT_SAMPLES",
    "branches": [
      {
        "type": "object",
        "properties": {
          "code": {
            "const": "CAPABILITY_UNAVAILABLE"
          },
          "phase": {
            "const": "readback"
          },
          "retryability": {
            "const": "SAME_TRANSACTION_QUERY"
          },
          "mutationState": {
            "const": "UNKNOWN"
          },
          "transactionRef": {
            "const": "fixture-tx"
          },
          "causeCode": {
            "const": "APPLY_FAILED"
          },
          "reason": {
            "const": "TRANSPORT_OUTCOME_UNKNOWN"
          }
        },
        "required": [
          "code",
          "phase",
          "retryability",
          "mutationState",
          "transactionRef",
          "causeCode",
          "reason"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "code": {
            "const": "CAPABILITY_UNAVAILABLE"
          },
          "phase": {
            "const": "validate"
          },
          "retryability": {
            "const": "AFTER_NEW_FACTS"
          },
          "mutationState": {
            "const": "NONE"
          },
          "transactionRef": {
            "const": null
          },
          "causeCode": {
            "const": null
          },
          "reason": {
            "const": "POLICY_UNAVAILABLE"
          }
        },
        "required": [
          "code",
          "phase",
          "retryability",
          "mutationState",
          "transactionRef",
          "causeCode",
          "reason"
        ],
        "additionalProperties": false
      }
    ],
    "originalLegalKeys": [
      "code",
      "phase",
      "retryability",
      "mutationState",
      "transactionRef",
      "causeCode",
      "reason"
    ],
    "evidence": [],
    "authority": "Painter carried-projection sample grammar only; no claim of real source ABI, exhaustive combinations or authorization",
    "rule": "Exact correlated document samples in original error position. Preserve original seven fields/UNKNOWN. Opaque/unrecognized exception rethrows identical object; never infer wildcard code/reason, wrapper or permissions.",
    "sampleProvenance": [
      {
        "id": "historical-unknown-exact-value",
        "path": "evidence/d110/historical-unknown-values.json",
        "classification": "HISTORICAL_LOCAL_CARRIER_VALUES_REUSED_AS_PAINTER_DOCUMENT_SAMPLE_NOT_REAL_SOURCE_LEGALITY"
      },
      {
        "id": "same-shape",
        "path": "src/local-context.mjs",
        "classification": "PAINTER_OWN_MISSING_FACTS_TUPLE_DOCUMENT_SAMPLE"
      }
    ],
    "byOperation": {
      "ValidateBuildProposal": {
        "branches": [
          {
            "type": "object",
            "properties": {
              "code": {
                "const": "CAPABILITY_UNAVAILABLE"
              },
              "phase": {
                "const": "readback"
              },
              "retryability": {
                "const": "SAME_TRANSACTION_QUERY"
              },
              "mutationState": {
                "const": "UNKNOWN"
              },
              "transactionRef": {
                "const": "fixture-tx"
              },
              "causeCode": {
                "const": "APPLY_FAILED"
              },
              "reason": {
                "const": "TRANSPORT_OUTCOME_UNKNOWN"
              }
            },
            "required": [
              "code",
              "phase",
              "retryability",
              "mutationState",
              "transactionRef",
              "causeCode",
              "reason"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "code": {
                "const": "CAPABILITY_UNAVAILABLE"
              },
              "phase": {
                "const": "validate"
              },
              "retryability": {
                "const": "AFTER_NEW_FACTS"
              },
              "mutationState": {
                "const": "NONE"
              },
              "transactionRef": {
                "const": null
              },
              "causeCode": {
                "const": null
              },
              "reason": {
                "const": "POLICY_UNAVAILABLE"
              }
            },
            "required": [
              "code",
              "phase",
              "retryability",
              "mutationState",
              "transactionRef",
              "causeCode",
              "reason"
            ],
            "additionalProperties": false
          }
        ],
        "originalLegalKeys": [
          "code",
          "phase",
          "retryability",
          "mutationState",
          "transactionRef",
          "causeCode",
          "reason"
        ],
        "evidence": [],
        "exhaustiveRealSource": false
      },
      "ValidateRegionProposal": {
        "branches": [
          {
            "type": "object",
            "properties": {
              "code": {
                "const": "CAPABILITY_UNAVAILABLE"
              },
              "phase": {
                "const": "readback"
              },
              "retryability": {
                "const": "SAME_TRANSACTION_QUERY"
              },
              "mutationState": {
                "const": "UNKNOWN"
              },
              "transactionRef": {
                "const": "fixture-tx"
              },
              "causeCode": {
                "const": "APPLY_FAILED"
              },
              "reason": {
                "const": "TRANSPORT_OUTCOME_UNKNOWN"
              }
            },
            "required": [
              "code",
              "phase",
              "retryability",
              "mutationState",
              "transactionRef",
              "causeCode",
              "reason"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "code": {
                "const": "CAPABILITY_UNAVAILABLE"
              },
              "phase": {
                "const": "validate"
              },
              "retryability": {
                "const": "AFTER_NEW_FACTS"
              },
              "mutationState": {
                "const": "NONE"
              },
              "transactionRef": {
                "const": null
              },
              "causeCode": {
                "const": null
              },
              "reason": {
                "const": "POLICY_UNAVAILABLE"
              }
            },
            "required": [
              "code",
              "phase",
              "retryability",
              "mutationState",
              "transactionRef",
              "causeCode",
              "reason"
            ],
            "additionalProperties": false
          }
        ],
        "originalLegalKeys": [
          "code",
          "phase",
          "retryability",
          "mutationState",
          "transactionRef",
          "causeCode",
          "reason"
        ],
        "evidence": [],
        "exhaustiveRealSource": false
      }
    }
  },
  "handshakeObservation": {
    "contracts": "hanaworlds-contracts@2.0.0",
    "wireVersions": [
      "BUILD/V5",
      "ReferenceBrief/v5",
      "canvas-region/v3",
      "canvas/v7",
      "interaction-surface/v5",
      "painter-region/v3",
      "painter/v6",
      "region-build/v2",
      "session/v5",
      "world-adapter-region/v3",
      "world-adapter/v8"
    ],
    "compiledOperationsVersion": "operations/v4",
    "factProfiles": [
      "target-facts/v5"
    ]
  },
  "describeObservation": {
    "painterId": "building-exterior",
    "wire": "painter/v6",
    "operations": [
      "ValidateBuildProposal",
      "ValidateRegionProposal"
    ],
    "consumes": [
      "painter/v6",
      "painter-region/v3",
      "ReferenceBrief/v5"
    ],
    "factProfiles": [
      "target-facts/v5",
      "material-sources/v2"
    ],
    "emits": [
      "BUILD/V5",
      "region-build/v2"
    ],
    "settings": {},
    "invariants": [
      "Only confirmed proposals and current world-source facts become BUILD/V5 or region-build/v2 plans.",
      "Zero model calls and zero world writes; no Canvas, Adapter or Brush call.",
      "Opaque materialRef and neutral orientation come only from the supplied Catalogue.",
      "Per-cell writes require sampled known-empty cells. Region null cells remain UNSPECIFIED; carve uses the Catalogue emptyMaterialRef.",
      "Confirmed site rules, hazard tags, entrance clearance and placement are rechecked by the public contracts.",
      "Current Host facts are read before planning and before release, including replay.",
      "Image colours use sharp and CIEDE2000 over validated ReadMaterialSources texture bytes; missing facts are refused."
    ],
    "modelCalls": 0,
    "worldWrites": 0,
    "tools": [
      {
        "name": "hanaworlds_image_material",
        "method": "matchCurrentImageMaterials",
        "input": "imageBytes: Uint8Array + fresh Catalogue + currentConnection + materialSources: ReadMaterialSources {snapshot, textures} (material-sources/v2)",
        "output": "dominant colour and nearest legal opaque materialRef/orientation with sourceRevision; proposal validation remains mandatory",
        "limits": {
          "maxBytes": 33554432,
          "maxPixels": 16777216,
          "formats": [
            "png",
            "jpeg",
            "webp"
          ]
        },
        "distanceRule": "CIEDE2000 (color-diff 1.4.0); exact ties UTF16 materialRef then numeric orientation",
        "dominantRule": "16x16x16 sRGB bins, alpha-byte weight; equal weight lowest packed bin; winning-bin linear-light mean",
        "materialColourRule": "alpha-byte weighted linear-light mean of KNOWN world-source texture bytes; static legality required",
        "modelCalls": 0,
        "worldWrites": 0
      },
      {
        "name": "ValidateRegionProposal",
        "operation": "ValidateRegionProposal",
        "wire": "painter-region/v3",
        "capability": "painter-region/v3:validate-region-proposal",
        "inputType": "RegionProposal",
        "purpose": "Batch fill or carve one region-voxels/v2 block (terrain, levelling, digging, large volumes); returns the block unchanged as a region BUILD for Brush, Canvas then commits it as one transaction with one whole-region Undo.",
        "typicalScale": "Many cells changing together, from hundreds to very large areas. Small structures and single-cell touch-ups usually use the per-box ValidateBuildProposal path.",
        "scaleUnit": "cells",
        "preconditions": [
          "Block origin/size use current-world grid coordinates under geometryProfile voxel-grid/v1, X_FASTEST_THEN_Y_THEN_Z and canonical runs; null = UNSPECIFIED (never written, never carve); carve explicitly references the world-source Catalogue emptyMaterialRef and one of its declared orientations.",
          "Every palette entry is {materialRef, orientation}: an opaque materialRef from the current world-source Catalogue, known and placeable, with orientation declared by that material (including emptyMaterialRef).",
          "Same Session, turn, confirmed intent, reference brief (including verified image media), world and connection as the current Host facts.",
          "Whether cells are loaded and known is checked by Adapter/Canvas before writing (unknown is refused there), not by Painter."
        ],
        "emits": "RegionBuildPlan (region-build/v2); no world, Canvas, Adapter or Brush call",
        "modelCalls": 0,
        "worldWrites": 0
      }
    ],
    "services": {
      "localFacts": true
    }
  },
  "versionCompatibility": {
    "allowed": [
      {
        "intent": "session/v5",
        "referenceBrief": "ReferenceBrief/v5"
      },
      {
        "intent": "session/v6",
        "referenceBrief": "ReferenceBrief/v6"
      }
    ],
    "digestDomains": {
      "v5": {
        "intent": "HanaWorlds|contracts@0.4.0|intent|",
        "reference-brief": "HanaWorlds|contracts@0.4.0|reference-brief|"
      },
      "v6": {
        "intent": "HanaWorlds|workshop|C-session@3|session/v6|intent|",
        "reference-brief": "HanaWorlds|workshop|C-session@3|session/v6|reference-brief|"
      }
    },
    "mixedRefusal": {
      "code": "UNSUPPORTED_VERSION",
      "phase": "decode",
      "retryability": "NEVER",
      "mutationState": "NONE",
      "transactionRef": null,
      "causeCode": null,
      "reason": "VERSION_UNSUPPORTED"
    },
    "legacyBaselineSHA": "774f645db6a02d44afd1352e116b792f89f3a2c7afe72f082d8b6b6fe9f8c8ad",
    "legacyDefinitionsCount": 145,
    "legacyDefinitions": "literal original 145 objects; unchanged LocalRequestFacts and image/helper surface",
    "v5RequestFacts": {
      "ValidateBuildProposal": "BuildProposalProviderFactsV5",
      "ValidateRegionProposal": "LocalRequestFacts"
    },
    "v6RequestFacts": {
      "ValidateBuildProposal": "BuildProposalProviderFactsV6",
      "ValidateRegionProposal": "RegionProposalProviderFactsV6"
    },
    "wireVersions": {
      "ValidateBuildProposal": "painter/v6",
      "ValidateRegionProposal": "painter-region/v3"
    },
    "publication": "APPEND_READY_REVIEW_REQUIRED; no formal release or real authorization inferred"
  },
  "confirmationSemantics": {
    "authority": "Painter-owned carried data projection; no new foreign call, action, service or permission",
    "carrier": "ConfirmationCarrierV6",
    "origin": "Existing caller must carry actual durable HostBuildIntentAuthorization and original complete intent/referenceBrief plus both digests; examples are authored data and do not prove persistence or authorization",
    "requiredEquality": [
      "confirmation.intent === request.intent",
      "confirmation.referenceBrief === request.referenceBrief",
      "confirmation.intentDigest === request.intentDigest",
      "confirmation.referenceBriefDigest === request.referenceBriefDigest",
      "confirmation.authorization.sessionRef === request.sessionRef",
      "confirmation.authorization.turnRevision === request.turnRevision",
      "confirmation.authorization.localContext === request.localContext",
      "confirmation.authorization.intent === request.intent.confirmedIntent",
      "request.intent.confirmedIntent.confirmedTurnRevision === request.turnRevision",
      "request.referenceBrief.sessionRef === request.sessionRef",
      "request.referenceBrief.turnRevision === request.turnRevision",
      "request.intent.intendedWorldRef === request.worldRef",
      "request.intent.referenceBriefDigest === request.referenceBriefDigest"
    ],
    "digest": "Recompute full declared present fields using selected versionCompatibility.digestDomains; no version relabel, omitted placement or v5 fallback for v6",
    "facts": "At first and release read validate full sourceContext/currentContext, each equals request minus requestId/proposal INCLUDING confirmation; currentConfirmation equals entire request.confirmation; requestFacts remains legacy LocalRequestFacts and fresh currentBriefDigest equals selected brief digest",
    "beforeAwaitAndRelease": "Retain provider identity before read and after each await and before final release, including replay; check real AbortSignal; source identity replacement fails CURRENT_WORLD_MISMATCH/validate/REVISION_CHANGED; cancellation fails REQUEST_CANCELLED/validate/REVISION_CHANGED",
    "unconfirmed": "currentConfirmation null => INTENT_UNCONFIRMED/validate/REQUIRED_FACT_UNKNOWN; complete unequal confirmation or recomputed digest => Build INTENT_UNCONFIRMED/validate/PAYLOAD_CHANGED, Region INTENT_UNCONFIRMED/validate/REQUIRED_FACT_UNKNOWN (original Region closed tuple retained); complete sourceContext/currentContext unequal => CURRENT_WORLD_MISMATCH/validate/REVISION_CHANGED",
    "sourceIntegrity": "Do not fabricate sourceContext/currentContext/currentConfirmation by copying requests in runtime. Existing caller supplies independently read persistent source truth. Auth messageDigest/proposalDigest are original opaque values, not authority inferred from authored example digests.",
    "error": "Preserve exact original correlated seven fields and error position, UNKNOWN, and opaque exception identity; getter never executed. Original four provider/Client requests remain pending at journey gate.",
    "effects": "No model, world write, foreign contract call, media fetch or new service. BUILD/V5 and region-build/v2 geometric outputs and old domains remain unchanged."
  },
  "confirmationInvalidationSemantics": {
    "fields": [
      "turn",
      "brief",
      "media",
      "localContext",
      "siteRules",
      "placement"
    ],
    "reads": [
      1,
      2
    ],
    "code": "INTENT_UNCONFIRMED",
    "phase": "validate",
    "retryability": "AFTER_NEW_FACTS",
    "mutationState": "NONE",
    "transactionRef": null,
    "causeCode": null,
    "reasonByOperation": {
      "ValidateBuildProposal": "PAYLOAD_CHANGED",
      "ValidateRegionProposal": "REQUIRED_FACT_UNKNOWN"
    },
    "priority": "Specific current-world mismatch and cancellation examples retain their explicit original errors. Coherent complete snapshot invalidation in these 24 cases uses per-operation original closed intent refusal.",
    "binding": "Changed full sourceContext/currentContext/currentConfirmation agree with each other, including refreshed intent/brief version-domain digests, authorization intent/turn/localContext and requestFacts; unchanged request no longer matches. readFacts contains exact first/release values, recoveryRequest/recoveryFacts/recoveryExpected restores the same original instance inputs.",
    "placement": "Build authored from full copied RegionInspection; Region own authored source evidence fields and exact block-origin cell; no inference of an external inspection API or acquisition authorization",
    "sourceOrigin": "Authored closed samples only; actual durable before/release mapping still required from original consumer at real journey gate"
  },
  "consumption": {
    "contracts": [
      "C-painter"
    ],
    "registeredServices": [
      "hanaworldsPainterV2PictureBlocks",
      "hanaworlds_image_material"
    ],
    "routes": {
      "ValidateBuildProposal": {
        "caller": "workshop",
        "receiver": "painter",
        "resultReceiver": "workshop"
      },
      "ValidateRegionProposal": {
        "caller": "workshop",
        "receiver": "painter",
        "resultReceiver": "workshop"
      },
      "hanaworlds_image_material": {
        "caller": "skills",
        "receiver": "painter",
        "resultReceiver": "skills"
      }
    },
    "factsDelivery": "Existing authorized C-painter consumer carries owned complete projections; no direct foreign contract calls or added services",
    "existingSourceReadback": "src/index.mjs ctx.get(\"hanaworldsPainterLocalFacts\") or same ctx property; historical access name retained, not a new registered/authorized service",
    "authorizationClosed": false,
    "requestRouting": "Four independent requests to PM; providers unify their own surfaces, no Painter consumption relationship added"
  },
  "registrationIO": {
    "package": "hanaworlds-building-exterior-painter",
    "apply": {
      "arguments": [
        "ctx with original provide/get roles",
        "ConfigInput optional instance settings"
      ],
      "result": "ExteriorPainterV2",
      "provides": [
        "hanaworldsPainterV2PictureBlocks",
        "hanaworlds_image_material"
      ],
      "doesNotRegisterLocalFacts": true
    },
    "Config": {
      "input": "ConfigInput",
      "output": "same admitted optional settings; {} remains {}",
      "effectiveDefaults": {
        "maxBytes": 33554432,
        "maxPixels": 16777216,
        "formats": [
          "png",
          "jpeg",
          "webp"
        ]
      },
      "scope": "single painter and its registered tool; no global or extra hidden budget"
    },
    "calls": {
      "ValidateBuildProposal": {
        "caller": "workshop",
        "receiver": "painter",
        "input": "ValidateBuildProposalRequest object/strict JSON/Uint8Array",
        "output": "ValidateBuildProposalResponse",
        "options": "optional real AbortSignal"
      },
      "ValidateRegionProposal": {
        "caller": "workshop",
        "receiver": "painter",
        "input": "ValidateRegionProposalRequest object/strict JSON/Uint8Array",
        "output": "ValidateRegionProposalResponse",
        "options": "optional real AbortSignal"
      },
      "hanaworlds_image_material": {
        "caller": "skills",
        "receiver": "painter",
        "input": "ImageMaterialInput typed imageBytes/textures bytes; JSON lists restored at in-process channel",
        "output": "ImageMaterialResult or complete original ImageMaterialError"
      }
    },
    "unknownOperation": "No added operation/authority; unchanged original unsupported rejection"
  },
  "documentSHA256": "6bf499ea4c062e3b18fd190dd8a636e333fb76a596909defddb7edfd04f60f2e"
};
