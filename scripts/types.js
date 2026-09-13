/**
 * Soundingboard 2.0 - Core Type Definitions (JSDoc)
 * Pure type definitions; no runtime code.
 */

/**
 * @typedef {Object} Commandments
 * @property {string|null} inciting_incident
 * @property {string|null} progressive_complication
 * @property {string|null} crisis
 * @property {string|null} climax
 * @property {string|null} resolution
 */

/**
 * @typedef {'planned' | 'drafted' | 'diagnosed' | 'audited' | 'passed' | 'incomplete'} ProductionStatus
 */

/**
 * @typedef {Object} SceneRecord
 * @property {string} id - Scene ID (sc-NNNN)
 * @property {string} chapter - Parent chapter ID (ch-NN)
 * @property {string|null} pov - Dominant character point of view
 * @property {string|null} location - Physical or temporal setting
 * @property {string[]|null} [threads] - Associated thread IDs (e.g. ['th-01'])
 * @property {string|null} value_in - Entering life value state (e.g. 'Trust (+)')
 * @property {string|null} value_out - Exiting life value state (e.g. 'Betrayal (--)')
 * @property {Commandments|null} commandments - Five commandments breakdown
 * @property {string|null} voice_anchor - Scene ID used to anchor voice calibration
 * @property {boolean} anchor_provisional - Whether the voice anchor is provisional (out-of-order draft)
 * @property {string[]} craft_modules - OKF craft modules loaded for drafting/diagnosis
 * @property {ProductionStatus} status - Production lifecycle state
 * @property {string|number} schema - Schema version (e.g. '2.0')
 */

/**
 * @typedef {Object} ChapterRecord
 * @property {string} id - Chapter ID (ch-NN)
 * @property {number} number - Chapter sequence number
 * @property {string} title - Chapter title
 * @property {string[]} scenes - Ordered array of scene IDs (sc-NNNN)
 * @property {string} break_rationale - Author-written rationale for the chapter break
 * @property {boolean} [break_rationale_missing] - Whether break_rationale is absent (Stage 02 completeness failure)
 * @property {ProductionStatus} status - Production status
 * @property {string|number} schema - Schema version
 */

/**
 * @typedef {Object} ThreadAct
 * @property {string} id - Act identifier (e.g. 'act-1')
 * @property {string} scenes_from - First scene in act
 * @property {string} scenes_to - Last scene in act
 */

/**
 * @typedef {Object} ThreadRecord
 * @property {string} id - Thread ID (th-NN)
 * @property {string} name - Thread title / description
 * @property {boolean} spine - Whether this thread represents the core global spine
 * @property {string} value_spectrum - Polarities tracked (e.g. 'Trust / Betrayal')
 * @property {ThreadAct[]} acts - Acts attached to this specific thread
 * @property {number} dormancy_threshold_words - Max words thread can remain silent before warning
 * @property {'open' | 'resolved'} status - Thread resolution state
 */

/**
 * @typedef {'established' | 'believed' | 'contested' | 'ambiguous'} EpistemicStatus
 */

/**
 * @typedef {Object} CanonEntry
 * @property {string} id - Canon fact ID (e-NNNN)
 * @property {string} entity - Subject entity (character, place, item, rule)
 * @property {string} attribute - Attribute or relation
 * @property {string} fact - Established assertion
 * @property {string[]} established_in - Scene IDs that established this fact
 * @property {Record<string, string>} computed_against - Map of scene ID to prose hash
 * @property {EpistemicStatus} status - Epistemic truth status
 * @property {string|null} believed_by - Character who believes this (if status: believed)
 * @property {string|null} reader_known_as_of - Scene ID when this fact becomes known to reader
 * @property {string|null} confirmed - Date fact was confirmed by author
 */

/**
 * @typedef {Object} ManuscriptIndex
 * @property {string} schema_version - Index schema version
 * @property {'scene' | 'chapter'} unit_type - Storage model type
 * @property {ChapterRecord[]} chapters - Registered chapter assemblies
 * @property {SceneRecord[]} scenes - Registered scene records
 * @property {ThreadRecord[]} threads - Registered thread records
 * @property {number} total_words - Cumulative manuscript word count
 * @property {string} last_reindex - ISO timestamp of last tree scan
 */

export {};
