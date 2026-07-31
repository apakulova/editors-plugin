"use strict";
const NBSP = "\u00A0";
const DEVELOPMENT_NBSP_MARKER = "*";
const DEVELOPMENT_NBSP_FILL = {
    type: "SOLID",
    color: { r: 1, g: 64 / 255, b: 83 / 255 },
};
const DEVELOPMENT_MARKER_INDEXES_PLUGIN_DATA_KEY = "developmentMarkerIndexes";
const DEVELOPMENT_MARKER_TEXT_PLUGIN_DATA_KEY = "developmentMarkerText";
const DEVELOPMENT_MARKER_COLOR_TOLERANCE = 0.001;
const NB_HYPHEN = "\u2011";
const EN_DASH = "\u2013";
const EM_DASH = "\u2014";
const MINUS = "\u2212";
const COMMAND_OPEN_SETTINGS = "open-settings";
const ANALYTICS_API_HOST = "https://eu.i.posthog.com";
const ANALYTICS_CAPTURE_PATH = "/i/v0/e/";
const ANALYTICS_PROJECT_TOKEN = "phc_BkVcyxEX27UmgdY7RhHQkquqQVL49kHhL9qDPNsFYzcp";
const ANALYTICS_SCHEMA_VERSION = 5;
const ANALYTICS_PLUGIN_RELEASE = "2026-07-30";
const PERFORMANCE_MEASUREMENT_VERSION = 3;
const RULE_ANALYTICS_VERSION = 1;
const ANALYTICS_ANONYMOUS_ID_KEY = "analyticsAnonymousId";
const ANALYTICS_EVENT_QUEUE_KEY = "analyticsEventQueue";
const ANALYTICS_CLOSE_GRACE_PERIOD_MS = 500;
const ANALYTICS_MAX_QUEUED_EVENTS = 100;
const FINAL_NOTIFICATION_CLOSE_FALLBACK_MS = 6000;
const FINAL_NOTIFICATION_TIMEOUT_MS = 4000;
const LETTERS = "A-Za-zА-Яа-яЁё";
const PERCENT_WORD_WHITELIST_PATTERN = "скидк(?:а|и|е|у|ой|ою)|кэшбэк(?:а|у|ом|е)?|кешбэк(?:а|у|ом|е)?|ставк(?:а|и|е|у|ой)|комисси(?:я|и|ю|ей)|доходност(?:ь|и|ью)|рассрочк(?:а|и|е|у|ой)|налог(?:а|у|ом|е)?|ндс";
const DOTTED_ABBREVIATIONS = "тыс|мин|д|кв|г|гл|илл|ст|п|см|им|обл|кр|пос|пер|пр|просп|пл|бул|наб|ш|туп|оф|комн|мкр|уч|вл|влад|корп|эт|пгт|рис|стр|руб|коп";
const STYLE_FIELDS = [
    "boundVariables",
    "fillStyleId",
    "fontName",
    "fontSize",
    "fills",
    "hyperlink",
    "textCase",
    "textDecoration",
    "textDecorationColor",
    "textDecorationOffset",
    "textDecorationSkipInk",
    "textDecorationStyle",
    "textDecorationThickness",
    "letterSpacing",
    "lineHeight",
    "listOptions",
    "listSpacing",
    "indentation",
    "paragraphIndent",
    "paragraphSpacing",
    "textStyleId",
    "textStyleOverrides",
];
const TYPOGRAPHY_RULE_CODES = [
    "quote_ru_levels",
    "quote_latin_levels",
    "quote_context_script",
    "quote_punctuation_outside",
    "quote_ellipsis_position",
    "quote_question_exclamation",
    "punctuation_ellipsis",
    "punctuation_repeated_marks",
    "punctuation_question_exclamation_order",
    "dash_between_words",
    "range_simple",
    "range_simple_number",
    "range_simple_word_date",
    "range_simple_time",
    "range_simple_short_date",
    "range_simple_roman",
    "range_compound",
    "range_compound_grouped_number",
    "range_compound_full_date",
    "range_compound_word_date",
    "range_compound_quarter",
    "range_compound_open_year",
    "hyphen_nonbreaking_words",
    "dash_line_start",
    "dash_nbsp_before",
    "phone_ru_format",
    "phone_ru_separators",
    "phone_ru_prefix_seven",
    "phone_ru_prefix_eight",
    "phone_protected_contexts",
    "number_group_digits",
    "number_decimal_comma",
    "number_document_outline",
    "number_western_format",
    "number_unit_currency_nbsp",
    "year_context",
    "number_protect_ip",
    "number_protect_version",
    "number_protect_date",
    "number_protect_code",
    "number_protect_sign",
    "abbr_dotted",
    "abbr_compound",
    "abbr_undotted_large_number",
    "abbr_undotted_hyphenated",
    "abbr_undotted_units",
    "abbr_area_volume",
    "abbr_month",
    "abbr_sentence_end",
    "abbr_line_break",
    "nbsp_before_dash",
    "nbsp_after_number_sign",
    "nbsp_copyright_year",
    "nbsp_number_unit",
    "nbsp_percent_metric",
    "nbsp_calendar_date",
    "nbsp_initials",
    "nbsp_particles",
    "nbsp_short_cyrillic_words",
    "space_collapse",
    "space_trim_lines",
    "space_before_punctuation",
    "space_after_opening_punctuation",
    "space_percent",
    "space_tilde",
    "math_expression_spacing",
    "math_multiplication",
    "math_basic_operators",
    "math_subtraction_context",
    "math_negative_number",
    "math_fractions",
    "temperature_degree_only",
    "temperature_scale",
    "temperature_range",
    "percent_range",
    "symbol_legal_marks",
    "symbol_arrow",
];
const pendingAnalyticsEvents = [];
let analyticsIdentityPromise = null;
let analyticsQueueOperation = Promise.resolve();
let typographRunPromise = null;
async function run() {
    try {
        if (figma.command === COMMAND_OPEN_SETTINGS) {
            openSettingsUI();
            return;
        }
        await runTypograph(getDefaultRunOptions(), "quick_run");
    }
    catch (error) {
        console.error("[Чистовик] Failed to clean typography", error);
        presentRunOutcome({
            error: true,
            message: getFailureNotificationMessage(error),
        }, "quick_run", true);
    }
}
function openSettingsUI() {
    try {
        figma.showUI(__html__, {
            height: 372,
            themeColors: true,
            width: 360,
        });
        queueAnalyticsEvent("settings_opened", { source: "settings" });
        figma.ui.onmessage = async (message) => {
            try {
                if (message.type === "close") {
                    figma.closePlugin();
                    return;
                }
                if (message.type === "channel-link-clicked") {
                    queueAnalyticsEvent("channel_link_clicked", {
                        link: "channel",
                        source: "about_tab",
                    });
                    return;
                }
                if (message.type === "run-typograph") {
                    await runTypograph(getRunOptionsFromMessage(message), "settings");
                }
            }
            catch (error) {
                console.error("[Чистовик] Failed to handle UI message", error);
                presentRunOutcome({
                    error: true,
                    message: getFailureNotificationMessage(error),
                }, "settings", true);
                postTypographRunFinished();
            }
        };
    }
    catch (error) {
        console.error("[Чистовик] Failed to open settings UI", error);
        throw error;
    }
}
function runTypograph(options, source) {
    if (typographRunPromise !== null) {
        return typographRunPromise;
    }
    const currentRunPromise = executeTypographRun(options, source);
    typographRunPromise = currentRunPromise;
    void currentRunPromise.then(() => {
        if (typographRunPromise === currentRunPromise) {
            typographRunPromise = null;
        }
    }, () => {
        if (typographRunPromise === currentRunPromise) {
            typographRunPromise = null;
        }
    });
    return currentRunPromise;
}
async function executeTypographRun(options, source) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const analyticsContext = createAnalyticsRunContext(options, source);
    let analyticsStage = "unknown";
    let collectTextDuration = 0;
    let collection = null;
    let result = null;
    let workingNotification = null;
    let outcome = {
        error: true,
        message: "Ой, не получилось почистить 🛑",
    };
    let workingNotificationCancelled = true;
    try {
        workingNotification = figma.notify("Чистовик работает...", { timeout: Infinity });
        queueAnalyticsEvent("plugin_run_started", getRunAnalyticsProperties(analyticsContext));
        figma.skipInvisibleInstanceChildren = !options.processHiddenNodes;
        analyticsStage = "collect_nodes";
        collection = await measureAsyncDuration((duration) => {
            collectTextDuration += duration;
        }, () => collectTargetTextNodes({
            processHidden: options.processHiddenNodes,
            processLocked: options.processLockedNodes,
        }));
        analyticsStage = "clean_text";
        result = await processTextNodes(collection.nodes, collection.skippedLocked, collection.skippedHidden, options);
        if (result.failed > 0) {
            analyticsStage = (_a = result.failedStage) !== null && _a !== void 0 ? _a : "unknown";
            const processingError = new Error(`Failed to process ${result.failed} text node(s)`);
            if (((_b = result.failureDiagnostic) === null || _b === void 0 ? void 0 : _b.category) === "rollback_failed" || result.requiresStyleWarning) {
                processingError.name = "RollbackFailureError";
            }
            throw processingError;
        }
        outcome = {
            error: false,
            message: getCleanResultNotificationMessage(result),
        };
        queueAnalyticsEvent("plugin_run_completed", Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, getRunAnalyticsProperties(analyticsContext)), { changed_anything: result.changed > 0, changed_text_layers_count: result.changed, characters_changed_total: result.analytics.charactersChangedTotal, characters_processed_total: result.analytics.charactersProcessedTotal, duration_ms: getAnalyticsDuration(analyticsContext), failed_text_layers_count: result.failed, found_text_layers_count: collection.nodes.length + collection.skippedHidden + collection.skippedLocked, largest_text_layer_characters: result.analytics.largestTextLayerCharacters, processed_text_layers_count: result.processed, rollback_attempted_layers_count: result.analytics.rollbackAttemptedLayersCount, rollback_failed_layers_count: result.analytics.rollbackFailedLayersCount, skipped_hidden_count: result.skippedHidden, skipped_locked_count: result.skippedLocked, slowest_text_layer_ms: result.analytics.slowestTextLayerMs, changed_style_segments_count: result.analytics.styleSegmentsCount, timing_collect_text_ms: collectTextDuration }), getTextProcessTimingAnalyticsProperties(result.analytics.timings)), getTypographyRuleAnalyticsProperties(result.analytics.ruleAnalytics)), { timing_other_ms: getOtherAnalyticsDuration(analyticsContext, collectTextDuration, result.analytics.timings), loaded_unique_fonts_count: result.analytics.uniqueFontsCount }));
    }
    catch (error) {
        console.error("[Чистовик] Failed to run typograph", error);
        const errorDiagnostic = (_c = result === null || result === void 0 ? void 0 : result.failureDiagnostic) !== null && _c !== void 0 ? _c : createAnalyticsErrorDiagnostic(error, analyticsStage);
        queueAnalyticsEvent("plugin_run_failed", Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, getRunAnalyticsProperties(analyticsContext)), { duration_ms: getAnalyticsDuration(analyticsContext), error_category: errorDiagnostic.category, error_fingerprint: errorDiagnostic.fingerprint, error_location: errorDiagnostic.location, error_name: errorDiagnostic.name, error_operation: errorDiagnostic.operation, failed_text_layers_count: (_d = result === null || result === void 0 ? void 0 : result.failed) !== null && _d !== void 0 ? _d : null, found_text_layers_count: collection === null ? null : collection.nodes.length + collection.skippedHidden + collection.skippedLocked, characters_changed_total: (_e = result === null || result === void 0 ? void 0 : result.analytics.charactersChangedTotal) !== null && _e !== void 0 ? _e : null, characters_processed_total: (_f = result === null || result === void 0 ? void 0 : result.analytics.charactersProcessedTotal) !== null && _f !== void 0 ? _f : null, largest_text_layer_characters: (_g = result === null || result === void 0 ? void 0 : result.analytics.largestTextLayerCharacters) !== null && _g !== void 0 ? _g : null, processed_text_layers_count: (_h = result === null || result === void 0 ? void 0 : result.processed) !== null && _h !== void 0 ? _h : null, rollback_attempted_layers_count: (_j = result === null || result === void 0 ? void 0 : result.analytics.rollbackAttemptedLayersCount) !== null && _j !== void 0 ? _j : null, rollback_failed_layers_count: (_k = result === null || result === void 0 ? void 0 : result.analytics.rollbackFailedLayersCount) !== null && _k !== void 0 ? _k : null, slowest_text_layer_ms: (_l = result === null || result === void 0 ? void 0 : result.analytics.slowestTextLayerMs) !== null && _l !== void 0 ? _l : null, stage: analyticsStage, changed_style_segments_count: (_m = result === null || result === void 0 ? void 0 : result.analytics.styleSegmentsCount) !== null && _m !== void 0 ? _m : null, timing_collect_text_ms: collectTextDuration }), (result === null ? {} : getTextProcessTimingAnalyticsProperties(result.analytics.timings))), (result === null ? {} : getTypographyRuleAnalyticsProperties(result.analytics.ruleAnalytics))), { timing_other_ms: result === null ? null : getOtherAnalyticsDuration(analyticsContext, collectTextDuration, result.analytics.timings), loaded_unique_fonts_count: (_o = result === null || result === void 0 ? void 0 : result.analytics.uniqueFontsCount) !== null && _o !== void 0 ? _o : null }));
        outcome = {
            error: true,
            message: getFailureNotificationMessage(error),
        };
    }
    finally {
        workingNotificationCancelled = cancelNotificationSafely(workingNotification);
        if (source === "settings") {
            postTypographRunFinished();
        }
    }
    presentRunOutcome(outcome, source, workingNotificationCancelled);
}
function postTypographRunFinished() {
    try {
        figma.ui.postMessage({ type: "typograph-run-finished" });
    }
    catch (error) {
        console.error("[Чистовик] Failed to reset typograph UI state", error);
    }
}
function cancelNotificationSafely(notification) {
    try {
        notification === null || notification === void 0 ? void 0 : notification.cancel();
        return true;
    }
    catch (error) {
        console.error("[Чистовик] Failed to cancel notification", error);
        return false;
    }
}
function presentRunOutcome(outcome, source, workingNotificationCancelled) {
    if (source === "settings") {
        try {
            figma.notify(outcome.message, {
                error: outcome.error,
                timeout: FINAL_NOTIFICATION_TIMEOUT_MS,
            });
        }
        catch (error) {
            console.error("[Чистовик] Failed to show final settings notification", error);
        }
        return;
    }
    if (!workingNotificationCancelled) {
        closePluginWithMessageSafely(outcome.message);
        return;
    }
    let notificationFinished = false;
    let closeFallback = null;
    const finishQuickRun = () => {
        if (notificationFinished) {
            return;
        }
        notificationFinished = true;
        if (closeFallback !== null) {
            clearTimeout(closeFallback);
        }
        void closeQuickPluginAfterAnalyticsGrace();
    };
    try {
        figma.notify(outcome.message, {
            error: outcome.error,
            onDequeue: finishQuickRun,
            timeout: FINAL_NOTIFICATION_TIMEOUT_MS,
        });
        if (!notificationFinished) {
            closeFallback = setTimeout(() => {
                if (notificationFinished) {
                    return;
                }
                notificationFinished = true;
                closePluginWithMessageSafely(outcome.message);
            }, FINAL_NOTIFICATION_CLOSE_FALLBACK_MS);
        }
    }
    catch (error) {
        console.error("[Чистовик] Failed to show final quick-run notification", error);
        closePluginWithMessageSafely(outcome.message);
    }
}
async function closeQuickPluginAfterAnalyticsGrace() {
    try {
        await waitForPendingAnalyticsEvents(ANALYTICS_CLOSE_GRACE_PERIOD_MS);
        figma.closePlugin();
    }
    catch (error) {
        console.error("[Чистовик] Failed to close quick-run plugin", error);
    }
}
function closePluginWithMessageSafely(message) {
    try {
        figma.closePlugin(message);
    }
    catch (error) {
        console.error("[Чистовик] Failed to close plugin with final message", error);
    }
}
function getFailureNotificationMessage(error) {
    try {
        if (getErrorName(error) === "RollbackFailureError") {
            return "Плагин случайно сломал какие-то стили — проверьте текстовые слои 🛑";
        }
    }
    catch (_a) {
        // Fall back to the regular error message.
    }
    return "Ой, не получилось почистить 🛑";
}
function createAnalyticsRunContext(options, source) {
    try {
        return {
            mode: getAnalyticsRunMode(options, source),
            options,
            runId: createAnalyticsRunId(),
            selection: getSelectionAnalyticsSummary(figma.currentPage.selection),
            source,
            startedAt: getMonotonicTimeMs(),
        };
    }
    catch (_a) {
        return {
            mode: getAnalyticsRunMode(options, source),
            options,
            runId: createAnalyticsRunId(),
            selection: {
                scope: "page",
                selectedNodesCount: 0,
                selectedTextNodesCount: 0,
            },
            source,
            startedAt: getMonotonicTimeMs(),
        };
    }
}
function getAnalyticsRunMode(options, source) {
    try {
        return source === "quick_run" ? "default" : options.mode;
    }
    catch (_a) {
        return "default";
    }
}
function getSelectionAnalyticsSummary(selection) {
    try {
        if (selection.length === 0) {
            return {
                scope: "page",
                selectedNodesCount: 0,
                selectedTextNodesCount: 0,
            };
        }
        const selectedTextNodesCount = selection.filter((node) => node.type === "TEXT").length;
        if (selection.length > 1) {
            return {
                scope: "multi_selection",
                selectedNodesCount: selection.length,
                selectedTextNodesCount,
            };
        }
        return {
            scope: selection[0].type === "TEXT" ? "single_text" : "container",
            selectedNodesCount: 1,
            selectedTextNodesCount,
        };
    }
    catch (_a) {
        return {
            scope: "page",
            selectedNodesCount: 0,
            selectedTextNodesCount: 0,
        };
    }
}
function getRunAnalyticsProperties(context) {
    try {
        return {
            mode: context.mode,
            process_hidden_nodes: context.options.processHiddenNodes,
            process_locked_nodes: context.options.processLockedNodes,
            recolor_existing_asterisks: context.options.recolorExistingAsterisks,
            performance_measurement_version: PERFORMANCE_MEASUREMENT_VERSION,
            run_id: context.runId,
            selected_nodes_count: context.selection.selectedNodesCount,
            selected_text_nodes_count: context.selection.selectedTextNodesCount,
            selection_scope: context.selection.scope,
            source: context.source,
        };
    }
    catch (_a) {
        return {};
    }
}
function getAnalyticsDuration(context) {
    try {
        return Math.max(0, getMonotonicTimeMs() - context.startedAt);
    }
    catch (_a) {
        return 0;
    }
}
function getTextProcessTimingAnalyticsProperties(timings) {
    return {
        timing_compare_text_ms: timings.compareText,
        timing_development_markers_ms: timings.developmentMarkers,
        timing_fonts_ms: timings.fonts,
        timing_read_styles_ms: timings.readStyles,
        timing_restore_styles_ms: timings.restoreStyles,
        timing_typography_ms: timings.typography,
        timing_write_text_ms: timings.writeText,
    };
}
function getTypographyRuleAnalyticsProperties(summary) {
    try {
        return {
            rule_analytics_version: RULE_ANALYTICS_VERSION,
            rule_change_pairs_count: Object.keys(summary.changePairs).length,
            rule_change_pairs_json: JSON.stringify(summary.changePairs),
            rule_changed_codes: summary.changedCodes.join(","),
            rule_changed_codes_count: summary.changedCodes.length,
            rule_failed_code: summary.failedRuleCode,
            rule_measured_codes_count: summary.measuredCodesCount,
            rule_metrics_json: JSON.stringify(summary.metrics),
            rule_most_active_code: summary.mostActiveRuleCode,
            rule_most_active_changed_layers: summary.mostActiveRuleChangedLayers,
            rule_slowest_code: summary.slowestRuleCode,
            rule_slowest_duration_ms: summary.slowestRuleDurationMs,
        };
    }
    catch (_a) {
        return {
            rule_analytics_version: RULE_ANALYTICS_VERSION,
        };
    }
}
function getOtherAnalyticsDuration(context, collectTextDuration, timings) {
    const measuredDuration = collectTextDuration +
        timings.typography +
        timings.fonts +
        timings.readStyles +
        timings.compareText +
        timings.writeText +
        timings.restoreStyles +
        timings.developmentMarkers;
    return Math.max(0, getAnalyticsDuration(context) - measuredDuration);
}
function measureDuration(reportDuration, operation) {
    const startedAt = getMonotonicTimeMs();
    try {
        return operation();
    }
    finally {
        reportDuration(Math.max(0, getMonotonicTimeMs() - startedAt));
    }
}
async function measureAsyncDuration(reportDuration, operation) {
    const startedAt = getMonotonicTimeMs();
    try {
        return await operation();
    }
    finally {
        reportDuration(Math.max(0, getMonotonicTimeMs() - startedAt));
    }
}
function getMonotonicTimeMs() {
    var _a;
    try {
        const runtime = globalThis;
        if (typeof ((_a = runtime.performance) === null || _a === void 0 ? void 0 : _a.now) === "function") {
            return runtime.performance.now();
        }
    }
    catch (_b) {
        // Date.now is a safe fallback in runtimes without the high-resolution timer.
    }
    return Date.now();
}
function createTypographyRuleAnalyticsCollector() {
    const metrics = new Map();
    for (const code of TYPOGRAPHY_RULE_CODES) {
        metrics.set(code, {
            calls: 0,
            changedApplications: 0,
            changedTextLayers: new Set(),
            durationMs: 0,
        });
    }
    return {
        changePairs: new Map(),
        currentTextLayerIndex: -1,
        failedRuleCode: null,
        lastChangedRuleCodeByTextLayer: new Map(),
        metrics,
    };
}
function beginTypographyRuleAnalyticsTextLayer(collector, textLayerIndex) {
    try {
        collector.currentTextLayerIndex = textLayerIndex;
    }
    catch (_a) {
        // Rule analytics must never affect typography.
    }
}
function applyTypographyRule(collector, code, input, operation) {
    if (collector === null) {
        return operation(input);
    }
    const startedAt = getMonotonicTimeMs();
    try {
        const result = operation(input);
        recordTypographyRuleMetric(collector, code, Math.max(0, getMonotonicTimeMs() - startedAt), result !== input, true);
        return result;
    }
    catch (error) {
        collector.failedRuleCode = code;
        recordTypographyRuleMetric(collector, code, Math.max(0, getMonotonicTimeMs() - startedAt), false, true);
        throw error;
    }
}
function recordTypographyRuleDerivedChange(collector, code) {
    if (collector === null) {
        return;
    }
    recordTypographyRuleMetric(collector, code, 0, true, false);
}
function recordTypographyRuleObservation(collector, code) {
    if (collector === null) {
        return;
    }
    recordTypographyRuleMetric(collector, code, 0, false, false);
}
function recordTypographyRuleMetric(collector, code, durationMs, changed, trackChangeSequence) {
    var _a;
    try {
        const existing = collector.metrics.get(code);
        const metric = existing !== null && existing !== void 0 ? existing : {
            calls: 0,
            changedApplications: 0,
            changedTextLayers: new Set(),
            durationMs: 0,
        };
        metric.calls += 1;
        metric.durationMs += durationMs;
        if (changed) {
            metric.changedApplications += 1;
            if (collector.currentTextLayerIndex >= 0) {
                metric.changedTextLayers.add(collector.currentTextLayerIndex);
                if (trackChangeSequence) {
                    const previousCode = collector.lastChangedRuleCodeByTextLayer.get(collector.currentTextLayerIndex);
                    if (previousCode !== undefined && previousCode !== code) {
                        const pair = `${previousCode}>${code}`;
                        collector.changePairs.set(pair, ((_a = collector.changePairs.get(pair)) !== null && _a !== void 0 ? _a : 0) + 1);
                    }
                    collector.lastChangedRuleCodeByTextLayer.set(collector.currentTextLayerIndex, code);
                }
            }
        }
        collector.metrics.set(code, metric);
    }
    catch (_b) {
        // Rule analytics must never affect typography.
    }
}
function createTypographyRuleAnalyticsSummary(collector) {
    try {
        const metrics = {};
        const changedCodes = [];
        let mostActiveRuleCode = null;
        let mostActiveRuleChangedLayers = 0;
        let slowestRuleCode = null;
        let slowestRuleDurationMs = 0;
        for (const [code, metric] of collector.metrics.entries()) {
            const changedTextLayers = metric.changedTextLayers.size;
            const durationMs = roundAnalyticsDuration(metric.durationMs);
            metrics[code] = {
                calls: metric.calls,
                changedApplications: metric.changedApplications,
                changedTextLayers,
                durationMs,
            };
            if (metric.changedApplications > 0) {
                changedCodes.push(code);
            }
            if (changedTextLayers > mostActiveRuleChangedLayers) {
                mostActiveRuleCode = code;
                mostActiveRuleChangedLayers = changedTextLayers;
            }
            if (durationMs > slowestRuleDurationMs) {
                slowestRuleCode = code;
                slowestRuleDurationMs = durationMs;
            }
        }
        changedCodes.sort();
        return {
            changePairs: Object.fromEntries(collector.changePairs.entries()),
            changedCodes,
            failedRuleCode: collector.failedRuleCode,
            measuredCodesCount: collector.metrics.size,
            metrics,
            mostActiveRuleCode,
            mostActiveRuleChangedLayers,
            slowestRuleCode,
            slowestRuleDurationMs,
        };
    }
    catch (_a) {
        return {
            changePairs: {},
            changedCodes: [],
            failedRuleCode: collector.failedRuleCode,
            measuredCodesCount: 0,
            metrics: {},
            mostActiveRuleCode: null,
            mostActiveRuleChangedLayers: 0,
            slowestRuleCode: null,
            slowestRuleDurationMs: 0,
        };
    }
}
function roundAnalyticsDuration(durationMs) {
    return Math.round(Math.max(0, durationMs) * 1000) / 1000;
}
function queueAnalyticsEvent(event, properties = {}) {
    try {
        const capturedAt = new Date().toISOString();
        const eventId = createAnalyticsEventId();
        const promise = trackAnalyticsEvent(event, properties, capturedAt, eventId);
        pendingAnalyticsEvents.push(promise);
        void promise.finally(() => {
            const index = pendingAnalyticsEvents.indexOf(promise);
            if (index !== -1) {
                pendingAnalyticsEvents.splice(index, 1);
            }
        });
    }
    catch (_a) {
        // Analytics must never affect plugin behavior.
    }
}
async function waitForPendingAnalyticsEvents(timeoutMs) {
    try {
        if (pendingAnalyticsEvents.length === 0) {
            return;
        }
        await Promise.race([
            Promise.all(pendingAnalyticsEvents.slice()).then(() => undefined),
            delay(timeoutMs),
        ]);
    }
    catch (_a) {
        // Analytics must never affect plugin behavior.
    }
}
function delay(timeoutMs) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeoutMs);
    });
}
async function trackAnalyticsEvent(event, properties = {}, capturedAt = new Date().toISOString(), eventId = createAnalyticsEventId()) {
    try {
        const identity = await getAnalyticsIdentity();
        const payload = createAnalyticsEventPayload(event, properties, identity, capturedAt);
        await enqueueAnalyticsEvent(payload, eventId);
        await flushQueuedAnalyticsEvents();
    }
    catch (_a) {
        // Analytics must never affect plugin behavior.
    }
}
function createAnalyticsEventPayload(event, properties, identity, capturedAt) {
    return {
        api_key: ANALYTICS_PROJECT_TOKEN,
        distinct_id: identity.distinctId,
        event,
        properties: Object.assign(Object.assign({}, properties), { $geoip_disable: true, $process_person_profile: false, analytics_schema_version: ANALYTICS_SCHEMA_VERSION, identity_type: identity.identityType, plugin_release: ANALYTICS_PLUGIN_RELEASE }),
        timestamp: capturedAt,
    };
}
function getAnalyticsCaptureEndpoint() {
    return `${ANALYTICS_API_HOST}${ANALYTICS_CAPTURE_PATH}`;
}
async function enqueueAnalyticsEvent(payload, eventId) {
    await runAnalyticsQueueOperation(async () => {
        const queue = await readQueuedAnalyticsEvents();
        const nextEvent = {
            attempts: 0,
            id: eventId,
            payload,
        };
        const nextQueue = queue
            .filter((queuedEvent) => queuedEvent.id !== nextEvent.id)
            .concat(nextEvent)
            .slice(-ANALYTICS_MAX_QUEUED_EVENTS);
        await writeQueuedAnalyticsEvents(nextQueue);
    });
}
async function flushQueuedAnalyticsEvents() {
    await runAnalyticsQueueOperation(async () => {
        const queue = await readQueuedAnalyticsEvents();
        if (queue.length === 0) {
            return;
        }
        const remainingQueue = [];
        for (const queuedEvent of queue) {
            try {
                await sendAnalyticsPayload(queuedEvent.payload);
            }
            catch (_a) {
                remainingQueue.push(Object.assign(Object.assign({}, queuedEvent), { attempts: queuedEvent.attempts + 1 }));
            }
        }
        await writeQueuedAnalyticsEvents(remainingQueue.slice(-ANALYTICS_MAX_QUEUED_EVENTS));
    });
}
async function sendAnalyticsPayload(payload) {
    const response = await fetch(getAnalyticsCaptureEndpoint(), {
        body: JSON.stringify(payload),
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
    });
    if (!response.ok) {
        throw new Error(`PostHog capture failed: ${response.status}`);
    }
}
function runAnalyticsQueueOperation(operation) {
    const nextOperation = analyticsQueueOperation.then(operation, operation);
    analyticsQueueOperation = nextOperation.then(() => undefined, () => undefined);
    return nextOperation;
}
async function readQueuedAnalyticsEvents() {
    const storedQueue = await figma.clientStorage.getAsync(ANALYTICS_EVENT_QUEUE_KEY);
    if (!Array.isArray(storedQueue)) {
        return [];
    }
    return storedQueue
        .map(toQueuedAnalyticsEvent)
        .filter((event) => event !== null)
        .slice(-ANALYTICS_MAX_QUEUED_EVENTS);
}
async function writeQueuedAnalyticsEvents(queue) {
    await figma.clientStorage.setAsync(ANALYTICS_EVENT_QUEUE_KEY, queue);
}
function toQueuedAnalyticsEvent(value) {
    if (typeof value !== "object" || value === null) {
        return null;
    }
    const event = value;
    const payload = sanitizeAnalyticsPayload(event.payload);
    if (typeof event.id !== "string" || payload === null) {
        return null;
    }
    return {
        attempts: typeof event.attempts === "number" ? event.attempts : 0,
        id: event.id,
        payload,
    };
}
function sanitizeAnalyticsPayload(value) {
    if (typeof value !== "object" || value === null) {
        return null;
    }
    const payload = value;
    if (typeof payload.api_key !== "string" ||
        typeof payload.distinct_id !== "string" ||
        typeof payload.event !== "string" ||
        typeof payload.properties !== "object" ||
        payload.properties === null ||
        typeof payload.timestamp !== "string") {
        return null;
    }
    return {
        api_key: payload.api_key,
        distinct_id: payload.distinct_id,
        event: payload.event,
        properties: payload.properties,
        timestamp: payload.timestamp,
    };
}
async function getAnalyticsIdentity() {
    if (analyticsIdentityPromise === null) {
        analyticsIdentityPromise = resolveAnalyticsIdentity();
    }
    return analyticsIdentityPromise;
}
async function resolveAnalyticsIdentity() {
    try {
        const storedAnonymousId = await figma.clientStorage.getAsync(ANALYTICS_ANONYMOUS_ID_KEY);
        const anonymousId = typeof storedAnonymousId === "string" && storedAnonymousId !== "" ? storedAnonymousId : createAnalyticsAnonymousId();
        if (anonymousId !== storedAnonymousId) {
            await figma.clientStorage.setAsync(ANALYTICS_ANONYMOUS_ID_KEY, anonymousId);
        }
        return {
            anonymousId,
            distinctId: anonymousId,
            identityType: "anonymous",
            userId: null,
        };
    }
    catch (_a) {
        const anonymousId = createAnalyticsAnonymousId();
        return {
            anonymousId,
            distinctId: anonymousId,
            identityType: "anonymous",
            userId: null,
        };
    }
}
function createAnalyticsAnonymousId() {
    try {
        return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}_${Math.random().toString(36).slice(2, 12)}`;
    }
    catch (_a) {
        return "anon_fallback";
    }
}
function createAnalyticsEventId() {
    try {
        return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}_${Math.random().toString(36).slice(2, 12)}`;
    }
    catch (_a) {
        return `evt_fallback_${Date.now().toString(36)}`;
    }
}
function createAnalyticsRunId() {
    try {
        return `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}_${Math.random().toString(36).slice(2, 12)}`;
    }
    catch (_a) {
        return `run_fallback_${Date.now().toString(36)}`;
    }
}
function getErrorName(error) {
    try {
        if (error instanceof Error && error.name !== "") {
            return error.name;
        }
        if (typeof error === "object" && error !== null && "name" in error && typeof error.name === "string" && error.name !== "") {
            return error.name;
        }
        return "UnknownError";
    }
    catch (_a) {
        return "UnknownError";
    }
}
function createErrorFingerprint(error) {
    try {
        const name = getErrorName(error);
        const message = getErrorMessage(error);
        return hashAnalyticsString(`${name}:${message}`);
    }
    catch (_a) {
        return "unknown";
    }
}
function getErrorMessage(error) {
    try {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
            return error.message;
        }
        return String(error);
    }
    catch (_a) {
        return "";
    }
}
function createAnalyticsErrorDiagnostic(error, stage) {
    return {
        category: classifyAnalyticsError(error, stage),
        fingerprint: createErrorFingerprint(error),
        location: getAnalyticsErrorLocation(stage),
        name: getErrorName(error),
        operation: getAnalyticsErrorOperation(stage),
    };
}
function classifyAnalyticsError(error, stage) {
    const message = getErrorMessage(error).toLowerCase();
    if (/(timeout|timed out|deadline)/.test(message)) {
        return "timeout";
    }
    if (/(font).*(unavailable|missing|not found|failed|load)|failed.*font/.test(message)) {
        return "font_unavailable";
    }
    if (/(read.?only|readonly|not editable|cannot edit|can.?t edit|locked|permission|not allowed)/.test(message)) {
        return "layer_not_editable";
    }
    if (/(removed|detached|deleted|invalid node|node.*not found|does not exist)/.test(message)) {
        return "layer_changed";
    }
    if (/(mixed|unsupported|symbol)/.test(message)) {
        return "mixed_or_unsupported_property";
    }
    if (stage === "write_text") {
        return "write_text_failed";
    }
    if (stage === "restore_styles" || stage === "development_markers") {
        return "restore_styles_failed";
    }
    if (stage === "rollback_styles") {
        return "rollback_failed";
    }
    if (stage === "clean_text" || stage === "compare_text") {
        return "typography_failed";
    }
    return "unknown";
}
function getAnalyticsErrorOperation(stage) {
    const operations = {
        clean_text: "apply_typography_rules",
        collect_nodes: "collect_target_text_layers",
        compare_text: "compare_original_and_clean_text",
        development_markers: "apply_development_markers",
        load_fonts: "load_text_layer_fonts",
        read_styles: "capture_text_layer_styles",
        restore_styles: "restore_text_layer_styles",
        rollback_styles: "restore_original_text_layer_state",
        unknown: "unknown",
        write_text: "write_clean_text",
    };
    return operations[stage];
}
function getAnalyticsErrorLocation(stage) {
    const locations = {
        clean_text: "src/code.ts:cleanTypographyWithMetadata",
        collect_nodes: "src/code.ts:collectTargetTextNodes",
        compare_text: "src/code.ts:buildStyleMap",
        development_markers: "src/code.ts:applyDevelopmentMarkerStyles",
        load_fonts: "src/code.ts:loadFontsForTextNode",
        read_styles: "src/code.ts:captureTextStyles",
        restore_styles: "src/code.ts:restoreTextStyles",
        rollback_styles: "src/code.ts:restoreOriginalTextAfterStyleFailure",
        unknown: "src/code.ts:runTypograph",
        write_text: "src/code.ts:processTextNodes/write_clean_text",
    };
    return locations[stage];
}
function hashAnalyticsString(input) {
    try {
        let hash = 0;
        for (let index = 0; index < input.length; index += 1) {
            hash = (hash * 31 + input.charCodeAt(index)) | 0;
        }
        return Math.abs(hash).toString(36);
    }
    catch (_a) {
        return "unknown";
    }
}
function getDefaultRunOptions() {
    try {
        return {
            mode: "beauty",
            processHiddenNodes: false,
            processLockedNodes: false,
            recolorExistingAsterisks: false,
        };
    }
    catch (error) {
        console.error("[Чистовик] Failed to get default run options", error);
        throw error;
    }
}
function getRunOptionsFromMessage(message) {
    var _a, _b, _c, _d;
    try {
        const defaults = getDefaultRunOptions();
        const mode = ((_a = message.options) === null || _a === void 0 ? void 0 : _a.mode) === "development" ? "development" : defaults.mode;
        return {
            mode,
            processHiddenNodes: ((_b = message.options) === null || _b === void 0 ? void 0 : _b.processHiddenNodes) === true,
            processLockedNodes: ((_c = message.options) === null || _c === void 0 ? void 0 : _c.processLockedNodes) === true,
            recolorExistingAsterisks: mode === "development" && ((_d = message.options) === null || _d === void 0 ? void 0 : _d.recolorExistingAsterisks) === true,
        };
    }
    catch (error) {
        console.error("[Чистовик] Failed to get run options from UI message", error);
        throw error;
    }
}
function getCleanResultNotificationMessage(result) {
    try {
        if (result.skippedLocked > 0 || result.skippedHidden > 0) {
            const skippedLabel = getSkippedLayerLabel(result);
            if (result.changed > 0) {
                return `${skippedLabel} не тронуты, в остальном — теперь всё чисто 🔥🔥🔥`;
            }
            return `${skippedLabel} не тронуты, а остальное уже было чисто 👌`;
        }
        if (result.changed > 0) {
            return "Теперь всё чисто 🔥🔥🔥";
        }
        return "Всё уже было чисто 👌";
    }
    catch (error) {
        console.error("[Чистовик] Failed to prepare result notification", error);
        throw error;
    }
}
function getSkippedLayerLabel(result) {
    try {
        if (result.skippedLocked > 0 && result.skippedHidden > 0) {
            return "Замочки и скрытые слои";
        }
        if (result.skippedHidden > 0) {
            return "Скрытые слои";
        }
        return "Замочки";
    }
    catch (error) {
        console.error("[Чистовик] Failed to get skipped layer label", error);
        throw error;
    }
}
async function collectTargetTextNodes(options) {
    try {
        const selection = figma.currentPage.selection;
        let candidates = [];
        if (selection.length === 0) {
            await figma.currentPage.loadAsync();
            candidates = figma.currentPage.findAllWithCriteria({ types: ["TEXT"] });
        }
        else {
            const seen = new Set();
            for (const selectedNode of selection) {
                collectTextNodesFromNode(selectedNode, candidates, seen);
            }
        }
        return filterProcessableTextNodes(candidates, options);
    }
    catch (error) {
        console.error("[Чистовик] Failed to collect text nodes", error);
        throw error;
    }
}
function collectTextNodesFromNode(node, result, seen) {
    try {
        if (node.type === "TEXT") {
            if (!seen.has(node.id)) {
                result.push(node);
                seen.add(node.id);
            }
            return;
        }
        if ("findAllWithCriteria" in node) {
            const textNodes = node.findAllWithCriteria({ types: ["TEXT"] });
            for (const textNode of textNodes) {
                if (!seen.has(textNode.id)) {
                    result.push(textNode);
                    seen.add(textNode.id);
                }
            }
        }
    }
    catch (error) {
        console.error("[Чистовик] Failed to walk selected node", error);
        throw error;
    }
}
function filterProcessableTextNodes(textNodes, options) {
    try {
        const nodes = [];
        let skippedHidden = 0;
        let skippedLocked = 0;
        const hiddenStateCache = new Map();
        const lockedStateCache = new Map();
        for (const textNode of textNodes) {
            if (!options.processLocked && isLockedForProcessing(textNode, lockedStateCache)) {
                skippedLocked += 1;
            }
            else if (!options.processHidden && isHiddenForProcessing(textNode, hiddenStateCache)) {
                skippedHidden += 1;
            }
            else {
                nodes.push(textNode);
            }
        }
        return { nodes, skippedHidden, skippedLocked };
    }
    catch (error) {
        console.error("[Чистовик] Failed to filter processable text nodes", error);
        throw error;
    }
}
function isLockedForProcessing(node, cache = new Map()) {
    try {
        const visited = [];
        let current = node;
        let locked = false;
        while (current !== null) {
            const cached = cache.get(current.id);
            if (cached !== undefined) {
                locked = cached;
                break;
            }
            visited.push(current);
            if (hasLockedProperty(current) && current.locked) {
                locked = true;
                break;
            }
            current = current.parent;
        }
        for (const visitedNode of visited) {
            cache.set(visitedNode.id, locked);
        }
        return locked;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check locked node state", error);
        throw error;
    }
}
function isHiddenForProcessing(node, cache = new Map()) {
    try {
        const visited = [];
        let current = node;
        let hidden = false;
        while (current !== null) {
            const cached = cache.get(current.id);
            if (cached !== undefined) {
                hidden = cached;
                break;
            }
            visited.push(current);
            if (hasVisibleProperty(current) && !current.visible) {
                hidden = true;
                break;
            }
            current = current.parent;
        }
        for (const visitedNode of visited) {
            cache.set(visitedNode.id, hidden);
        }
        return hidden;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check hidden node state", error);
        throw error;
    }
}
function hasVisibleProperty(node) {
    try {
        return "visible" in node && typeof node.visible === "boolean";
    }
    catch (error) {
        console.error("[Чистовик] Failed to check visible property", error);
        throw error;
    }
}
function hasLockedProperty(node) {
    try {
        return "locked" in node && typeof node.locked === "boolean";
    }
    catch (error) {
        console.error("[Чистовик] Failed to check locked property", error);
        throw error;
    }
}
async function processTextNodes(textNodes, skippedLocked, skippedHidden, options) {
    try {
        let processed = 0;
        let changed = 0;
        let failed = 0;
        let failureDiagnostic = null;
        let failedStage = null;
        let requiresStyleWarning = false;
        const timings = createEmptyTextProcessTimings();
        let charactersChangedTotal = 0;
        let charactersProcessedTotal = 0;
        let largestTextLayerCharacters = 0;
        let rollbackAttemptedLayersCount = 0;
        let rollbackFailedLayersCount = 0;
        let slowestTextLayerMs = 0;
        let styleSegmentsCount = 0;
        const ruleAnalyticsCollector = createTypographyRuleAnalyticsCollector();
        const fontLoadCache = new Map();
        const loadedFontKeys = new Set();
        const standalonePhoneCountryPrefixIds = textNodes.length < 2
            ? new Set()
            : measureDuration((duration) => {
                timings.typography += duration;
            }, () => getStandalonePhoneCountryPrefixIds(textNodes));
        for (const textNode of textNodes) {
            const textLayerStartedAt = getMonotonicTimeMs();
            let currentStage = "unknown";
            let countedAsProcessed = false;
            let shouldStopProcessing = false;
            try {
                const oldText = textNode.characters;
                if (isWhitespaceOnlyText(oldText)) {
                    continue;
                }
                processed += 1;
                countedAsProcessed = true;
                beginTypographyRuleAnalyticsTextLayer(ruleAnalyticsCollector, processed - 1);
                charactersProcessedTotal += oldText.length;
                largestTextLayerCharacters = Math.max(largestTextLayerCharacters, oldText.length);
                currentStage = "development_markers";
                const existingDevelopmentMarkerIndexes = measureDuration((duration) => {
                    timings.developmentMarkers += duration;
                }, () => getExistingDevelopmentMarkerIndexes(textNode));
                currentStage = "clean_text";
                const cleanResult = measureDuration((duration) => {
                    timings.typography += duration;
                }, () => {
                    const inputText = standalonePhoneCountryPrefixIds.has(textNode.id) ? normalizeStandaloneRussianPhoneCountryPrefix(oldText) : oldText;
                    return cleanTypographyWithMetadata(inputText, options, existingDevelopmentMarkerIndexes, ruleAnalyticsCollector);
                });
                const newText = cleanResult.text;
                if (newText !== oldText) {
                    currentStage = "load_fonts";
                    await measureAsyncDuration((duration) => {
                        timings.fonts += duration;
                    }, () => loadFontsForTextNode(textNode, fontLoadCache, loadedFontKeys));
                    currentStage = "read_styles";
                    const styles = measureDuration((duration) => {
                        timings.readStyles += duration;
                    }, () => captureTextStyles(textNode));
                    currentStage = "compare_text";
                    const styleComparison = measureDuration((duration) => {
                        timings.compareText += duration;
                    }, () => createStyleRestorationPlan(oldText, newText, styles));
                    currentStage = "write_text";
                    measureDuration((duration) => {
                        timings.writeText += duration;
                    }, () => {
                        textNode.characters = newText;
                    });
                    currentStage = "restore_styles";
                    const { styleMap, verifyUniformLinkedStyle, wholeTextStyle } = styleComparison;
                    try {
                        if (wholeTextStyle !== null) {
                            await measureAsyncDuration((duration) => {
                                timings.restoreStyles += duration;
                            }, () => restoreWholeTextStyle(textNode, wholeTextStyle, verifyUniformLinkedStyle));
                        }
                        else {
                            await measureAsyncDuration((duration) => {
                                timings.restoreStyles += duration;
                            }, () => restoreTextStyles(textNode, styleMap, styles, verifyUniformLinkedStyle));
                        }
                        if (verifyUniformLinkedStyle && !verifyUniformStylePreservation(textNode, styles[0])) {
                            throw new Error("Linked style verification failed");
                        }
                    }
                    catch (error) {
                        rollbackAttemptedLayersCount += 1;
                        currentStage = "rollback_styles";
                        const rollbackSucceeded = await measureAsyncDuration((duration) => {
                            timings.restoreStyles += duration;
                        }, () => restoreOriginalTextAfterStyleFailure(textNode, oldText, styles));
                        if (!rollbackSucceeded) {
                            rollbackFailedLayersCount += 1;
                            requiresStyleWarning = true;
                            shouldStopProcessing = true;
                            throw new Error("Failed to restore original text layer state");
                        }
                        currentStage = "restore_styles";
                        throw error;
                    }
                    charactersChangedTotal += oldText.length;
                    styleSegmentsCount += styles.length;
                    currentStage = "development_markers";
                    measureDuration((duration) => {
                        timings.developmentMarkers += duration;
                    }, () => applyDevelopmentMarkerStyles(textNode, cleanResult.developmentMarkerIndexes));
                    changed += 1;
                }
                else {
                    currentStage = "development_markers";
                    measureDuration((duration) => {
                        timings.developmentMarkers += duration;
                    }, () => {
                        if (needsDevelopmentMarkerStyles(textNode, cleanResult.developmentMarkerIndexes)) {
                            applyDevelopmentMarkerStyles(textNode, cleanResult.developmentMarkerIndexes);
                        }
                    });
                }
                currentStage = "development_markers";
                measureDuration((duration) => {
                    timings.developmentMarkers += duration;
                }, () => syncDevelopmentMarkerPluginData(textNode, options, cleanResult.developmentMarkerIndexes));
            }
            catch (error) {
                failed += 1;
                if (shouldStopProcessing) {
                    failedStage = "rollback_styles";
                    failureDiagnostic = createAnalyticsErrorDiagnostic(error, "rollback_styles");
                }
                else {
                    const diagnostic = createAnalyticsErrorDiagnostic(error, currentStage);
                    failedStage !== null && failedStage !== void 0 ? failedStage : (failedStage = currentStage);
                    failureDiagnostic !== null && failureDiagnostic !== void 0 ? failureDiagnostic : (failureDiagnostic = diagnostic);
                }
                console.error(`[Чистовик] Failed to process text node ${textNode.id}`, error);
            }
            finally {
                if (countedAsProcessed) {
                    slowestTextLayerMs = Math.max(slowestTextLayerMs, Math.max(0, getMonotonicTimeMs() - textLayerStartedAt));
                }
            }
            if (shouldStopProcessing) {
                break;
            }
        }
        return {
            processed,
            changed,
            failed,
            failureDiagnostic,
            failedStage,
            requiresStyleWarning,
            skippedHidden,
            skippedLocked,
            analytics: {
                charactersChangedTotal,
                charactersProcessedTotal,
                largestTextLayerCharacters,
                rollbackAttemptedLayersCount,
                rollbackFailedLayersCount,
                slowestTextLayerMs,
                styleSegmentsCount,
                timings,
                uniqueFontsCount: loadedFontKeys.size,
                ruleAnalytics: createTypographyRuleAnalyticsSummary(ruleAnalyticsCollector),
            },
        };
    }
    catch (error) {
        console.error("[Чистовик] Failed to process text nodes", error);
        throw error;
    }
}
async function restoreOriginalTextAfterStyleFailure(textNode, oldText, styles) {
    try {
        textNode.characters = oldText;
        const wholeTextStyle = getWholeTextStyle(styles, oldText);
        if (wholeTextStyle !== null) {
            await restoreWholeTextStyle(textNode, wholeTextStyle);
        }
        else {
            await restoreTextStyles(textNode, buildStyleMap(oldText, oldText, styles), styles);
        }
        return verifyRestoredOriginalTextState(textNode, oldText, styles);
    }
    catch (rollbackError) {
        console.error(`[Чистовик] Failed to restore original text after style restoration failure for text node ${textNode.id}`, rollbackError);
        return false;
    }
}
function verifyRestoredOriginalTextState(textNode, oldText, originalStyles) {
    try {
        if (textNode.characters !== oldText) {
            return false;
        }
        const restoredStyles = captureTextStyles(textNode);
        if (restoredStyles.length !== originalStyles.length) {
            return false;
        }
        return originalStyles.every((originalStyle, index) => {
            const restoredStyle = restoredStyles[index];
            if (restoredStyle.start !== originalStyle.start || restoredStyle.end !== originalStyle.end) {
                return false;
            }
            return STYLE_FIELDS.every((field) => areStyleValuesEqual(restoredStyle[field], originalStyle[field]));
        });
    }
    catch (verificationError) {
        console.error(`[Чистовик] Failed to verify original text layer state for text node ${textNode.id}`, verificationError);
        return false;
    }
}
function createEmptyTextProcessTimings() {
    return {
        typography: 0,
        fonts: 0,
        readStyles: 0,
        compareText: 0,
        writeText: 0,
        restoreStyles: 0,
        developmentMarkers: 0,
    };
}
function isWhitespaceOnlyText(input) {
    try {
        return /^[ \t\r\n\u00A0]*$/.test(input);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check whitespace-only text", error);
        throw error;
    }
}
function getStandalonePhoneCountryPrefixIds(textNodes) {
    try {
        const result = new Set();
        const layoutInfos = getTextNodeLayoutInfos(textNodes);
        const phoneTails = layoutInfos.filter((info) => isRussianPhoneTailToken(info.text));
        if (phoneTails.length === 0) {
            return result;
        }
        for (const prefix of layoutInfos) {
            if (!isStandaloneRussianPhoneCountryPrefix(prefix.text)) {
                continue;
            }
            if (phoneTails.some((tail) => tail.containerId === prefix.containerId && isRightAdjacentSameLineText(prefix.box, tail.box))) {
                result.add(prefix.id);
            }
        }
        return result;
    }
    catch (error) {
        console.error("[Чистовик] Failed to find standalone phone country prefixes", error);
        throw error;
    }
}
function getTextNodeLayoutInfos(textNodes) {
    var _a, _b;
    try {
        const result = [];
        for (const textNode of textNodes) {
            const text = textNode.characters;
            if (isWhitespaceOnlyText(text) ||
                (!isStandaloneRussianPhoneCountryPrefix(text) && !isRussianPhoneTailToken(text)) ||
                textNode.absoluteBoundingBox === null) {
                continue;
            }
            result.push({
                box: textNode.absoluteBoundingBox,
                containerId: (_b = (_a = textNode.parent) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null,
                id: textNode.id,
                text,
            });
        }
        return result;
    }
    catch (error) {
        console.error("[Чистовик] Failed to collect text node layout info", error);
        throw error;
    }
}
function isRightAdjacentSameLineText(left, right) {
    try {
        const leftRight = left.x + left.width;
        const horizontalGap = right.x - leftRight;
        const leftCenterY = left.y + left.height / 2;
        const rightCenterY = right.y + right.height / 2;
        return horizontalGap >= 0 && horizontalGap <= 16 && Math.abs(leftCenterY - rightCenterY) <= Math.max(4, Math.min(left.height, right.height) / 2);
    }
    catch (error) {
        console.error("[Чистовик] Failed to compare text layer positions", error);
        throw error;
    }
}
async function loadFontsForTextNode(textNode, fontLoadCache, loadedFontKeys = new Set()) {
    try {
        const fonts = new Map();
        if (textNode.characters.length === 0) {
            return;
        }
        for (const font of textNode.getRangeAllFontNames(0, textNode.characters.length)) {
            fonts.set(`${font.family}\n${font.style}`, font);
        }
        await Promise.all(Array.from(fonts.values(), (font) => getFontLoadPromise(font, fontLoadCache, loadedFontKeys)));
    }
    catch (error) {
        console.error(`[Чистовик] Failed to load fonts for text node ${textNode.id}`, error);
        throw error;
    }
}
function getFontLoadPromise(font, fontLoadCache, loadedFontKeys = new Set()) {
    const key = `${font.family}\n${font.style}`;
    const cachedPromise = fontLoadCache.get(key);
    if (cachedPromise !== undefined) {
        return cachedPromise;
    }
    const loadPromise = figma.loadFontAsync(font).then(() => {
        loadedFontKeys.add(key);
    });
    fontLoadCache.set(key, loadPromise);
    return loadPromise;
}
function captureTextStyles(textNode) {
    try {
        if (textNode.characters.length === 0) {
            return [];
        }
        const segments = textNode.getStyledTextSegments(STYLE_FIELDS);
        const nodeTextStyleId = getNodeStyleId(textNode.textStyleId);
        const nodeFillStyleId = getNodeStyleId(textNode.fillStyleId);
        return segments.map((segment) => (Object.assign(Object.assign({}, segment), { fillStyleId: getPreservedRangeStyleId(textNode, segment.start, segment.end, segment.fillStyleId, nodeFillStyleId, (start, end) => textNode.getRangeFillStyleId(start, end)), textStyleId: getPreservedRangeStyleId(textNode, segment.start, segment.end, segment.textStyleId, nodeTextStyleId, (start, end) => textNode.getRangeTextStyleId(start, end)) })));
    }
    catch (error) {
        console.error(`[Чистовик] Failed to capture text styles for text node ${textNode.id}`, error);
        throw error;
    }
}
function getNodeStyleId(styleId) {
    try {
        return typeof styleId === "string" && styleId !== "" ? styleId : null;
    }
    catch (_a) {
        return null;
    }
}
function getPreservedRangeStyleId(textNode, start, end, segmentStyleId, nodeStyleId, getRangeStyleId) {
    try {
        const rangeStyleId = getRangeStyleId(start, end);
        if (typeof rangeStyleId === "string" && rangeStyleId !== "") {
            return rangeStyleId;
        }
        if (segmentStyleId !== "") {
            return segmentStyleId;
        }
        if (typeof rangeStyleId === "string" && nodeStyleId !== null) {
            return nodeStyleId;
        }
        const characterStyleId = getCommonCharacterStyleId(textNode, start, end, getRangeStyleId);
        if (characterStyleId !== null) {
            return characterStyleId;
        }
        return typeof rangeStyleId === "string" ? rangeStyleId : segmentStyleId;
    }
    catch (error) {
        console.error("[Чистовик] Failed to preserve range style id", error);
        throw error;
    }
}
function getCommonCharacterStyleId(textNode, start, end, getRangeStyleId) {
    try {
        let commonStyleId = null;
        for (let index = start; index < end; index += 1) {
            const characterStyleId = getRangeStyleId(index, index + 1);
            if (typeof characterStyleId !== "string") {
                return null;
            }
            if (commonStyleId === null) {
                commonStyleId = characterStyleId;
                continue;
            }
            if (characterStyleId !== commonStyleId) {
                return null;
            }
        }
        return commonStyleId;
    }
    catch (error) {
        console.error(`[Чистовик] Failed to capture character style id for text node ${textNode.id}`, error);
        throw error;
    }
}
function getWholeTextStyle(styles, oldText) {
    try {
        if (styles.length !== 1) {
            return null;
        }
        const style = styles[0];
        if (style.start !== 0 ||
            style.end !== oldText.length ||
            style.textStyleId === "" ||
            style.textStyleOverrides.length > 0 ||
            hasBoundStyleVariables(style) ||
            style.listOptions.type !== "NONE" ||
            style.listSpacing !== 0 ||
            style.indentation !== 0 ||
            style.paragraphIndent !== 0 ||
            style.paragraphSpacing !== 0) {
            return null;
        }
        return style;
    }
    catch (error) {
        console.error("[Чистовик] Failed to detect whole text style", error);
        throw error;
    }
}
function hasBoundStyleVariables(style) {
    try {
        return style.boundVariables !== undefined && Object.keys(style.boundVariables).length > 0;
    }
    catch (_a) {
        return true;
    }
}
async function restoreWholeTextStyle(textNode, style, skipUnchangedLinkedStyleIds = false) {
    try {
        const rangeEnd = textNode.characters.length;
        if (!skipUnchangedLinkedStyleIds || textNode.getRangeTextStyleId(0, rangeEnd) !== style.textStyleId) {
            await textNode.setTextStyleIdAsync(style.textStyleId);
        }
        if (style.fillStyleId !== "" &&
            (!skipUnchangedLinkedStyleIds || textNode.getRangeFillStyleId(0, rangeEnd) !== style.fillStyleId)) {
            await textNode.setFillStyleIdAsync(style.fillStyleId);
        }
        if (hasTextDecoration(style)) {
            restoreTextDecoration(textNode, 0, textNode.characters.length, style);
        }
    }
    catch (error) {
        console.error(`[Чистовик] Failed to restore whole text style for text node ${textNode.id}`, error);
        throw error;
    }
}
function hasTextDecoration(style) {
    return style.textDecoration !== "NONE";
}
function createStyleRestorationPlan(oldText, newText, styles) {
    try {
        const wholeTextStyle = getWholeTextStyle(styles, oldText);
        const verifyUniformLinkedStyle = canVerifyUniformLinkedStyle(oldText, styles);
        if (wholeTextStyle !== null) {
            return {
                styleMap: [],
                wholeTextStyle,
                verifyUniformLinkedStyle,
            };
        }
        if (styles.length === 1) {
            return {
                styleMap: new Array(newText.length).fill(0),
                wholeTextStyle: null,
                verifyUniformLinkedStyle,
            };
        }
        return {
            styleMap: buildStyleMap(oldText, newText, styles),
            wholeTextStyle: null,
            verifyUniformLinkedStyle: false,
        };
    }
    catch (error) {
        console.error("[Чистовик] Failed to create style restoration plan", error);
        throw error;
    }
}
function canVerifyUniformLinkedStyle(oldText, styles) {
    try {
        if (styles.length !== 1) {
            return false;
        }
        const style = styles[0];
        const coversWholeText = style.start === 0 && style.end === oldText.length;
        const hasLibraryLink = style.textStyleId !== "" || style.fillStyleId !== "";
        return coversWholeText && hasLibraryLink;
    }
    catch (_a) {
        return false;
    }
}
function verifyUniformStylePreservation(textNode, originalStyle) {
    try {
        const currentStyles = captureTextStyles(textNode);
        if (currentStyles.length !== 1) {
            return false;
        }
        const currentStyle = currentStyles[0];
        if (currentStyle.start !== 0 || currentStyle.end !== textNode.characters.length) {
            return false;
        }
        if ((originalStyle.textStyleId !== "" && currentStyle.textStyleId !== originalStyle.textStyleId) ||
            (originalStyle.fillStyleId !== "" && currentStyle.fillStyleId !== originalStyle.fillStyleId)) {
            return false;
        }
        return STYLE_FIELDS.every((field) => areStyleValuesEqual(currentStyle[field], originalStyle[field]));
    }
    catch (error) {
        console.error(`[Чистовик] Failed to verify style preservation for text node ${textNode.id}`, error);
        return false;
    }
}
function areStyleValuesEqual(left, right) {
    if (Object.is(left, right)) {
        return true;
    }
    if (Array.isArray(left) || Array.isArray(right)) {
        return (Array.isArray(left) &&
            Array.isArray(right) &&
            left.length === right.length &&
            left.every((value, index) => areStyleValuesEqual(value, right[index])));
    }
    if (typeof left !== "object" || left === null || typeof right !== "object" || right === null) {
        return false;
    }
    const leftRecord = left;
    const rightRecord = right;
    const leftKeys = Object.keys(leftRecord).sort();
    const rightKeys = Object.keys(rightRecord).sort();
    return (leftKeys.length === rightKeys.length &&
        leftKeys.every((key, index) => key === rightKeys[index] && areStyleValuesEqual(leftRecord[key], rightRecord[key])));
}
function buildStyleMap(oldText, newText, styles) {
    try {
        const oldIndexToStyle = new Array(oldText.length).fill(0);
        for (let styleIndex = 0; styleIndex < styles.length; styleIndex += 1) {
            const segment = styles[styleIndex];
            for (let index = segment.start; index < segment.end; index += 1) {
                oldIndexToStyle[index] = styleIndex;
            }
        }
        if (oldText === newText) {
            return oldIndexToStyle.slice(0, newText.length);
        }
        const oldIndexMap = buildOldIndexMap(oldText, newText);
        return oldIndexMap.map((oldIndex) => {
            var _a;
            const safeIndex = Math.max(0, Math.min(oldText.length - 1, oldIndex));
            return (_a = oldIndexToStyle[safeIndex]) !== null && _a !== void 0 ? _a : 0;
        });
    }
    catch (error) {
        console.error("[Чистовик] Failed to build style map", error);
        throw error;
    }
}
function buildOldIndexMap(oldText, newText) {
    try {
        if (oldText.length === 0) {
            return new Array(newText.length).fill(0);
        }
        if (oldText.length * newText.length > 9000000) {
            return buildGreedyOldIndexMap(oldText, newText);
        }
        const oldLength = oldText.length;
        const newLength = newText.length;
        const width = newLength + 1;
        const table = new Uint32Array((oldLength + 1) * (newLength + 1));
        for (let oldIndex = oldLength - 1; oldIndex >= 0; oldIndex -= 1) {
            for (let newIndex = newLength - 1; newIndex >= 0; newIndex -= 1) {
                const current = oldIndex * width + newIndex;
                if (oldText[oldIndex] === newText[newIndex]) {
                    table[current] = table[(oldIndex + 1) * width + newIndex + 1] + 1;
                }
                else {
                    table[current] = Math.max(table[(oldIndex + 1) * width + newIndex], table[oldIndex * width + newIndex + 1]);
                }
            }
        }
        const result = new Array(newLength).fill(0);
        let oldIndex = 0;
        let newIndex = 0;
        let lastMappedOldIndex = 0;
        while (oldIndex < oldLength && newIndex < newLength) {
            if (oldText[oldIndex] === newText[newIndex]) {
                result[newIndex] = oldIndex;
                lastMappedOldIndex = oldIndex;
                oldIndex += 1;
                newIndex += 1;
            }
            else if (table[(oldIndex + 1) * width + newIndex] >= table[oldIndex * width + newIndex + 1]) {
                oldIndex += 1;
            }
            else {
                result[newIndex] = lastMappedOldIndex;
                newIndex += 1;
            }
        }
        while (newIndex < newLength) {
            result[newIndex] = Math.min(lastMappedOldIndex, oldLength - 1);
            newIndex += 1;
        }
        return result;
    }
    catch (error) {
        console.error("[Чистовик] Failed to build old index map", error);
        throw error;
    }
}
function buildGreedyOldIndexMap(oldText, newText) {
    try {
        const result = [];
        let oldIndex = 0;
        for (let newIndex = 0; newIndex < newText.length; newIndex += 1) {
            const nextOldIndex = oldText.indexOf(newText[newIndex], oldIndex);
            if (nextOldIndex === -1) {
                result.push(Math.max(0, oldIndex - 1));
            }
            else {
                result.push(nextOldIndex);
                oldIndex = nextOldIndex + 1;
            }
        }
        return result;
    }
    catch (error) {
        console.error("[Чистовик] Failed to build greedy old index map", error);
        throw error;
    }
}
async function restoreTextStyles(textNode, styleMap, styles, skipUnchangedLinkedStyleIds = false) {
    var _a, _b;
    try {
        if (textNode.characters.length === 0 || styles.length === 0 || styleMap.length === 0) {
            return;
        }
        let start = 0;
        let currentStyleIndex = (_a = styleMap[0]) !== null && _a !== void 0 ? _a : 0;
        const variableCache = new Map();
        for (let index = 1; index <= styleMap.length; index += 1) {
            const nextStyleIndex = (_b = styleMap[index]) !== null && _b !== void 0 ? _b : -1;
            if (nextStyleIndex === currentStyleIndex && index < styleMap.length) {
                continue;
            }
            await applyStyleSegment(textNode, start, index, styles[currentStyleIndex], variableCache, skipUnchangedLinkedStyleIds);
            start = index;
            currentStyleIndex = nextStyleIndex;
        }
    }
    catch (error) {
        console.error(`[Чистовик] Failed to restore text styles for text node ${textNode.id}`, error);
        throw error;
    }
}
async function applyStyleSegment(textNode, start, end, style, variableCache, skipUnchangedLinkedStyleIds) {
    try {
        if (start >= end) {
            return;
        }
        restoreDetachedTextProperties(textNode, start, end, style);
        restoreDetachedFillProperties(textNode, start, end, style);
        textNode.setRangeListOptions(start, end, style.listOptions);
        if (style.listOptions.type !== "NONE") {
            textNode.setRangeListSpacing(start, end, style.listSpacing);
        }
        textNode.setRangeIndentation(start, end, style.indentation);
        textNode.setRangeParagraphIndent(start, end, style.paragraphIndent);
        textNode.setRangeParagraphSpacing(start, end, style.paragraphSpacing);
        await restoreStyleIds(textNode, start, end, style, skipUnchangedLinkedStyleIds);
        await restoreBoundVariables(textNode, start, end, style, variableCache);
        restoreOverriddenStyleProperties(textNode, start, end, style);
    }
    catch (error) {
        console.error("[Чистовик] Failed to apply style segment", error);
        throw error;
    }
}
function restoreDetachedTextProperties(textNode, start, end, style) {
    try {
        if (style.textStyleId !== "") {
            return;
        }
        textNode.setRangeFontName(start, end, style.fontName);
        textNode.setRangeFontSize(start, end, style.fontSize);
        textNode.setRangeTextCase(start, end, style.textCase);
        textNode.setRangeLetterSpacing(start, end, style.letterSpacing);
        textNode.setRangeLineHeight(start, end, style.lineHeight);
        restoreTextDecoration(textNode, start, end, style);
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore detached text properties", error);
        throw error;
    }
}
function restoreDetachedFillProperties(textNode, start, end, style) {
    try {
        if (style.fillStyleId !== "") {
            return;
        }
        textNode.setRangeFills(start, end, style.fills);
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore detached fill properties", error);
        throw error;
    }
}
async function restoreStyleIds(textNode, start, end, style, skipUnchangedLinkedStyleIds) {
    try {
        if (style.textStyleId !== "" &&
            (!skipUnchangedLinkedStyleIds || textNode.getRangeTextStyleId(start, end) !== style.textStyleId)) {
            await textNode.setRangeTextStyleIdAsync(start, end, style.textStyleId);
        }
        if (style.fillStyleId !== "" &&
            (!skipUnchangedLinkedStyleIds || textNode.getRangeFillStyleId(start, end) !== style.fillStyleId)) {
            await textNode.setRangeFillStyleIdAsync(start, end, style.fillStyleId);
        }
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore style ids", error);
        throw error;
    }
}
function restoreOverriddenStyleProperties(textNode, start, end, style) {
    try {
        if (shouldRestoreStyleOverride(style, "SEMANTIC_WEIGHT") || shouldRestoreStyleOverride(style, "SEMANTIC_ITALIC")) {
            textNode.setRangeFontName(start, end, style.fontName);
        }
        if (shouldRestoreStyleOverride(style, "HYPERLINK")) {
            restoreHyperlink(textNode, start, end, style);
        }
        if (hasTextDecoration(style) || shouldRestoreStyleOverride(style, "TEXT_DECORATION")) {
            restoreTextDecoration(textNode, start, end, style);
        }
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore overridden style properties", error);
        throw error;
    }
}
function shouldRestoreStyleOverride(style, overrideType) {
    try {
        if (style.textStyleId === "") {
            return true;
        }
        return style.textStyleOverrides.some((override) => override.type === overrideType);
    }
    catch (_a) {
        return false;
    }
}
function restoreTextDecoration(textNode, start, end, style) {
    try {
        textNode.setRangeTextDecoration(start, end, style.textDecoration);
        if (style.textDecorationStyle !== null) {
            textNode.setRangeTextDecorationStyle(start, end, style.textDecorationStyle);
        }
        if (style.textDecorationOffset !== null) {
            textNode.setRangeTextDecorationOffset(start, end, style.textDecorationOffset);
        }
        if (style.textDecorationThickness !== null) {
            textNode.setRangeTextDecorationThickness(start, end, style.textDecorationThickness);
        }
        if (style.textDecorationColor !== null) {
            textNode.setRangeTextDecorationColor(start, end, style.textDecorationColor);
        }
        if (style.textDecorationSkipInk !== null) {
            textNode.setRangeTextDecorationSkipInk(start, end, style.textDecorationSkipInk);
        }
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore text decoration", error);
        throw error;
    }
}
function restoreHyperlink(textNode, start, end, style) {
    try {
        textNode.setRangeHyperlink(start, end, style.hyperlink);
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore hyperlink", error);
        throw error;
    }
}
async function restoreBoundVariables(textNode, start, end, style, variableCache) {
    try {
        if (style.boundVariables === undefined) {
            return;
        }
        const entries = Object.entries(style.boundVariables);
        for (const [field, variableAlias] of entries) {
            let variablePromise = variableCache.get(variableAlias.id);
            if (variablePromise === undefined) {
                variablePromise = figma.variables.getVariableByIdAsync(variableAlias.id);
                variableCache.set(variableAlias.id, variablePromise);
            }
            const variable = await variablePromise;
            if (variable !== null) {
                textNode.setRangeBoundVariable(start, end, field, variable);
            }
        }
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore bound variables", error);
        throw error;
    }
}
function applyDevelopmentMarkerStyles(textNode, markerIndexes) {
    try {
        for (const index of markerIndexes) {
            if (textNode.characters[index] === DEVELOPMENT_NBSP_MARKER) {
                textNode.setRangeFills(index, index + 1, [createDevelopmentMarkerFill()]);
            }
        }
    }
    catch (error) {
        console.error(`[Чистовик] Failed to apply development marker styles for text node ${textNode.id}`, error);
        throw error;
    }
}
function needsDevelopmentMarkerStyles(textNode, markerIndexes) {
    try {
        for (const index of markerIndexes) {
            if (textNode.characters[index] !== DEVELOPMENT_NBSP_MARKER) {
                continue;
            }
            const fills = textNode.getRangeFills(index, index + 1);
            if (fills === figma.mixed || !isDevelopmentMarkerFills(fills)) {
                return true;
            }
        }
        return false;
    }
    catch (error) {
        console.error(`[Чистовик] Failed to check development marker styles for text node ${textNode.id}`, error);
        throw error;
    }
}
function isDevelopmentMarkerFills(fills) {
    try {
        return fills.length === 1 && isDevelopmentMarkerFill(fills[0]);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check development marker fills", error);
        throw error;
    }
}
function isDevelopmentMarkerFill(fill) {
    var _a;
    try {
        return fill.type === "SOLID" &&
            Math.abs(fill.color.r - DEVELOPMENT_NBSP_FILL.color.r) <= DEVELOPMENT_MARKER_COLOR_TOLERANCE &&
            Math.abs(fill.color.g - DEVELOPMENT_NBSP_FILL.color.g) <= DEVELOPMENT_MARKER_COLOR_TOLERANCE &&
            Math.abs(fill.color.b - DEVELOPMENT_NBSP_FILL.color.b) <= DEVELOPMENT_MARKER_COLOR_TOLERANCE &&
            ((_a = fill.opacity) !== null && _a !== void 0 ? _a : 1) === 1;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check development marker fill", error);
        throw error;
    }
}
function createDevelopmentMarkerFill() {
    try {
        return {
            type: DEVELOPMENT_NBSP_FILL.type,
            color: {
                r: DEVELOPMENT_NBSP_FILL.color.r,
                g: DEVELOPMENT_NBSP_FILL.color.g,
                b: DEVELOPMENT_NBSP_FILL.color.b,
            },
        };
    }
    catch (error) {
        console.error("[Чистовик] Failed to create development marker fill", error);
        throw error;
    }
}
function getExistingDevelopmentMarkerIndexes(textNode) {
    try {
        const indexes = new Set(getStoredDevelopmentMarkerIndexes(textNode));
        const text = textNode.characters;
        let index = text.indexOf(DEVELOPMENT_NBSP_MARKER);
        while (index !== -1) {
            const fills = textNode.getRangeFills(index, index + 1);
            if (fills !== figma.mixed && isDevelopmentMarkerFills(fills)) {
                indexes.add(index);
            }
            index = text.indexOf(DEVELOPMENT_NBSP_MARKER, index + 1);
        }
        return Array.from(indexes).sort((first, second) => first - second);
    }
    catch (error) {
        console.error(`[Чистовик] Failed to get existing development marker indexes for text node ${textNode.id}`, error);
        throw error;
    }
}
function getStoredDevelopmentMarkerIndexes(textNode) {
    try {
        const text = textNode.characters;
        if (textNode.getPluginData(DEVELOPMENT_MARKER_TEXT_PLUGIN_DATA_KEY) !== text) {
            return [];
        }
        const rawIndexes = textNode.getPluginData(DEVELOPMENT_MARKER_INDEXES_PLUGIN_DATA_KEY);
        if (rawIndexes === "") {
            return [];
        }
        const parsedIndexes = JSON.parse(rawIndexes);
        if (!Array.isArray(parsedIndexes)) {
            return [];
        }
        return parsedIndexes.filter((index) => Number.isInteger(index) && index >= 0 && index < text.length && text[index] === DEVELOPMENT_NBSP_MARKER);
    }
    catch (error) {
        console.error(`[Чистовик] Failed to get stored development marker indexes for text node ${textNode.id}`, error);
        return [];
    }
}
function syncDevelopmentMarkerPluginData(textNode, options, markerIndexes) {
    try {
        if (options.mode === "development" && markerIndexes.length > 0) {
            setPluginDataIfChanged(textNode, DEVELOPMENT_MARKER_TEXT_PLUGIN_DATA_KEY, textNode.characters);
            setPluginDataIfChanged(textNode, DEVELOPMENT_MARKER_INDEXES_PLUGIN_DATA_KEY, JSON.stringify(markerIndexes));
            return;
        }
        setPluginDataIfChanged(textNode, DEVELOPMENT_MARKER_TEXT_PLUGIN_DATA_KEY, "");
        setPluginDataIfChanged(textNode, DEVELOPMENT_MARKER_INDEXES_PLUGIN_DATA_KEY, "");
    }
    catch (error) {
        console.error(`[Чистовик] Failed to sync development marker plugin data for text node ${textNode.id}`, error);
        throw error;
    }
}
function setPluginDataIfChanged(textNode, key, value) {
    try {
        if (textNode.getPluginData(key) !== value) {
            textNode.setPluginData(key, value);
        }
    }
    catch (error) {
        console.error(`[Чистовик] Failed to update plugin data for text node ${textNode.id}`, error);
        throw error;
    }
}
function cleanTypography(input, options = getDefaultRunOptions()) {
    try {
        return cleanTypographyWithMetadata(input, options).text;
    }
    catch (error) {
        console.error("[Чистовик] Failed to clean text", error);
        throw error;
    }
}
function cleanTypographyWithMetadata(input, options = getDefaultRunOptions(), existingDevelopmentMarkerIndexes = [], ruleAnalyticsCollector = null) {
    try {
        const normalizedInput = normalizeInputNonBreakingSpaces(input);
        const asteriskSpaceCandidateIndexes = getExistingAsteriskSpaceCandidateIndexesForRun(normalizedInput, options);
        const markerIndexes = getDevelopmentMarkerIndexesForRun(normalizedInput, options, existingDevelopmentMarkerIndexes, asteriskSpaceCandidateIndexes);
        const inputWithKnownMarkers = restoreExistingDevelopmentMarkers(normalizedInput, [...markerIndexes, ...asteriskSpaceCandidateIndexes]);
        const beautyInput = restoreStableDevelopmentPatternMarkers(inputWithKnownMarkers);
        const beautyText = cleanTypographyForBeauty(beautyInput, ruleAnalyticsCollector);
        if (options.mode !== "development") {
            return {
                text: beautyText,
                developmentMarkerIndexes: [],
            };
        }
        return createDevelopmentTypographyResult(beautyText);
    }
    catch (error) {
        console.error("[Чистовик] Failed to clean text with metadata", error);
        throw error;
    }
}
function getExistingAsteriskSpaceCandidateIndexesForRun(input, options) {
    try {
        if (options.mode !== "development" || !options.recolorExistingAsterisks) {
            return [];
        }
        return getExistingAsteriskSpaceCandidateIndexes(input);
    }
    catch (error) {
        console.error("[Чистовик] Failed to get existing asterisk space candidate indexes for run", error);
        throw error;
    }
}
function getDevelopmentMarkerIndexesForRun(input, options, existingDevelopmentMarkerIndexes, asteriskSpaceCandidateIndexes) {
    try {
        const markerIndexes = new Set(existingDevelopmentMarkerIndexes);
        if (options.mode === "development" && options.recolorExistingAsterisks) {
            for (const index of getExistingAsteriskIndexesMatchingNonBreakingSpaces(input, asteriskSpaceCandidateIndexes)) {
                markerIndexes.add(index);
            }
        }
        return Array.from(markerIndexes).sort((first, second) => first - second);
    }
    catch (error) {
        console.error("[Чистовик] Failed to get development marker indexes for run", error);
        throw error;
    }
}
function getExistingAsteriskIndexesMatchingNonBreakingSpaces(input, asteriskSpaceCandidateIndexes) {
    try {
        if (asteriskSpaceCandidateIndexes.length === 0) {
            return [];
        }
        const candidateIndexSet = new Set(asteriskSpaceCandidateIndexes);
        const candidateInput = input
            .split("")
            .map((char, index) => (char === DEVELOPMENT_NBSP_MARKER && candidateIndexSet.has(index) ? " " : char))
            .join("");
        const candidateBeautyText = cleanTypographyForBeauty(restoreStableDevelopmentPatternMarkers(candidateInput));
        const candidateResult = createDevelopmentTypographyResult(candidateBeautyText);
        const indexes = [];
        for (const index of candidateResult.developmentMarkerIndexes) {
            if (candidateIndexSet.has(index) && input[index] === DEVELOPMENT_NBSP_MARKER && candidateResult.text[index] === DEVELOPMENT_NBSP_MARKER) {
                indexes.push(index);
            }
        }
        return indexes;
    }
    catch (error) {
        console.error("[Чистовик] Failed to get existing asterisk indexes matching non-breaking spaces", error);
        throw error;
    }
}
function getExistingAsteriskSpaceCandidateIndexes(input) {
    try {
        const indexes = [];
        let index = input.indexOf(DEVELOPMENT_NBSP_MARKER);
        while (index !== -1) {
            if (isSafeAsteriskSpaceCandidate(input, index)) {
                indexes.push(index);
            }
            index = input.indexOf(DEVELOPMENT_NBSP_MARKER, index + 1);
        }
        return indexes;
    }
    catch (error) {
        console.error("[Чистовик] Failed to get existing asterisk space candidate indexes", error);
        throw error;
    }
}
function isSafeAsteriskSpaceCandidate(input, index) {
    var _a, _b;
    try {
        if (!isIsolatedAsterisk(input, index) || isUnsafeAsteriskSpaceCandidate(input, index)) {
            return false;
        }
        const previous = (_a = input[index - 1]) !== null && _a !== void 0 ? _a : "";
        const next = (_b = input[index + 1]) !== null && _b !== void 0 ? _b : "";
        if ((isCyrillicLetter(previous) && isDash(next)) || (isDash(previous) && isCyrillicLetter(next))) {
            return true;
        }
        if (/\d/.test(previous) && isCyrillicLetter(next)) {
            return true;
        }
        if (!isCyrillicLetter(previous) || !isCyrillicLetter(next)) {
            return false;
        }
        return true;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check safe asterisk space candidate", error);
        throw error;
    }
}
function isUnsafeAsteriskSpaceCandidate(input, index) {
    var _a, _b;
    try {
        const previous = (_a = input[index - 1]) !== null && _a !== void 0 ? _a : "";
        const next = (_b = input[index + 1]) !== null && _b !== void 0 ? _b : "";
        if (/\d/.test(previous) && /\d/.test(next)) {
            return true;
        }
        const bounds = getLooseTokenBounds(input, index, index + 1);
        const token = input.slice(bounds.start, bounds.end);
        return isMaskedSecretToken(token) || /[A-Za-z]/.test(token) || token.includes("@") || token.includes("_");
    }
    catch (error) {
        console.error("[Чистовик] Failed to check unsafe asterisk space candidate", error);
        throw error;
    }
}
function isIsolatedAsterisk(input, index) {
    try {
        return input[index - 1] !== DEVELOPMENT_NBSP_MARKER && input[index + 1] !== DEVELOPMENT_NBSP_MARKER;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check isolated asterisk", error);
        throw error;
    }
}
function restoreStableDevelopmentPatternMarkers(input) {
    try {
        if (!input.includes(DEVELOPMENT_NBSP_MARKER)) {
            return input;
        }
        const chars = input.split("");
        restoreDevelopmentCopyrightYearMarkers(chars, input);
        restoreDevelopmentPhoneMarkers(chars, input);
        restoreDevelopmentGroupedNumberMarkers(chars, input);
        return chars.join("");
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore stable development pattern markers", error);
        throw error;
    }
}
function restoreDevelopmentCopyrightYearMarkers(chars, input) {
    try {
        const copyrightYearCandidate = /(©|\(c\))[\* \t\u00A0]*([12])\*(\d{3})\b/gi;
        input.replace(copyrightYearCandidate, (match, _copyright, _thousand, _rest, offset) => {
            try {
                restoreStarsInRange(chars, offset, offset + match.length);
                return match;
            }
            catch (error) {
                console.error("[Чистовик] Failed to restore development copyright year markers", error);
                return match;
            }
        });
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore development copyright year markers", error);
        throw error;
    }
}
function restoreDevelopmentPhoneMarkers(chars, input) {
    try {
        const phoneCandidate = /(^|[^\d])(\+?[78](?:[\* \t\u00A0().\-–—‑]*\d){10})(?![\* \t\u00A0().\-–—‑]*\d)(?![\* \t\u00A0]*[₽$€])/g;
        input.replace(phoneCandidate, (match, prefix, candidate, offset, fullText) => {
            try {
                const candidateStart = offset + prefix.length;
                if (previousNonSpaceSkippingDevelopmentMarker(fullText, candidateStart) === "№") {
                    return match;
                }
                const digits = candidate.replace(/\D/g, "");
                if (digits.length !== 11 || (digits[0] !== "7" && digits[0] !== "8")) {
                    return match;
                }
                restoreStarsInRange(chars, candidateStart, candidateStart + candidate.length);
                return match;
            }
            catch (error) {
                console.error("[Чистовик] Failed to restore development phone markers", error);
                return match;
            }
        });
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore development phone markers", error);
        throw error;
    }
}
function restoreDevelopmentGroupedNumberMarkers(chars, input) {
    try {
        const groupedNumberCandidate = /(^|[^\d])(\d{1,3}(?:\*\d{3})+(?:,\d+)?)(\*[₽$€])?/g;
        input.replace(groupedNumberCandidate, (match, prefix, number, currency, offset, fullText) => {
            var _a;
            try {
                const numberStart = offset + prefix.length;
                const previous = previousNonSpaceSkippingDevelopmentMarker(fullText, numberStart);
                if (previous === "№" || previous === "§" || isNumberAfterSignNumberPrefix(fullText, numberStart)) {
                    return match;
                }
                const groupCount = countMatches(number, /\*/g);
                if (groupCount < 2 && currency === undefined) {
                    return match;
                }
                restoreStarsInRange(chars, numberStart, numberStart + number.length + ((_a = currency === null || currency === void 0 ? void 0 : currency.length) !== null && _a !== void 0 ? _a : 0));
                return match;
            }
            catch (error) {
                console.error("[Чистовик] Failed to restore development grouped number markers", error);
                return match;
            }
        });
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore development grouped number markers", error);
        throw error;
    }
}
function restoreStarsInRange(chars, start, end) {
    try {
        for (let index = start; index < end; index += 1) {
            if (chars[index] === DEVELOPMENT_NBSP_MARKER) {
                chars[index] = " ";
            }
        }
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore stars in range", error);
        throw error;
    }
}
function createDevelopmentTypographyResult(beautyText) {
    try {
        let text = "";
        const developmentMarkerIndexes = [];
        for (let index = 0; index < beautyText.length; index += 1) {
            if (beautyText[index] === NBSP) {
                developmentMarkerIndexes.push(index);
                text += DEVELOPMENT_NBSP_MARKER;
            }
            else {
                text += beautyText[index];
            }
        }
        return { text, developmentMarkerIndexes };
    }
    catch (error) {
        console.error("[Чистовик] Failed to create development typography result", error);
        throw error;
    }
}
function cleanTypographyForBeauty(input, ruleAnalyticsCollector = null) {
    try {
        let text = input;
        text = cleanupSpaces(text, ruleAnalyticsCollector);
        text = cleanupQuotesAndPunctuation(text, ruleAnalyticsCollector);
        text = normalizeMathAndSymbols(text, ruleAnalyticsCollector);
        text = cleanupDashesAndHyphens(text, ruleAnalyticsCollector);
        text = formatPhoneNumbers(text, ruleAnalyticsCollector);
        text = formatNumbersAndMoney(text, ruleAnalyticsCollector);
        text = normalizeAbbreviations(text, ruleAnalyticsCollector);
        text = applyNonBreakingSpaces(text, ruleAnalyticsCollector);
        text = normalizeMathAndSymbols(text, ruleAnalyticsCollector);
        text = applyTypographyRule(ruleAnalyticsCollector, "year_context", text, normalizeSpacedYears);
        return text;
    }
    catch (error) {
        console.error("[Чистовик] Failed to clean text for beauty mode", error);
        throw error;
    }
}
function restoreExistingDevelopmentMarkers(input, markerIndexes) {
    try {
        if (markerIndexes.length === 0) {
            return input;
        }
        const chars = input.split("");
        for (const index of markerIndexes) {
            if (chars[index] === DEVELOPMENT_NBSP_MARKER) {
                chars[index] = " ";
            }
        }
        return chars.join("");
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore existing development markers", error);
        throw error;
    }
}
function normalizeInputNonBreakingSpaces(input) {
    try {
        return input.replace(/\u00A0/g, " ");
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize input non-breaking spaces", error);
        throw error;
    }
}
function cleanupSpaces(input, ruleAnalyticsCollector = null) {
    try {
        let text = applyTypographyRule(ruleAnalyticsCollector, "space_trim_lines", input, (value) => value
            .split("\n")
            .map((line) => line.replace(/^[ \t\u00A0]+|[ \t\u00A0]+$/g, ""))
            .join("\n"));
        text = applyTypographyRule(ruleAnalyticsCollector, "space_collapse", text, (value) => value.replace(/[ \t\u00A0]{2,}/g, " "));
        text = applyTypographyRule(ruleAnalyticsCollector, "space_before_punctuation", text, (value) => value.replace(/[ \t\u00A0]+([.…:;,?!»)\]])/g, "$1"));
        text = applyTypographyRule(ruleAnalyticsCollector, "space_after_opening_punctuation", text, (value) => value.replace(/([«(\[])[ \t\u00A0]+/g, "$1"));
        text = applyTypographyRule(ruleAnalyticsCollector, "space_percent", text, (value) => value.replace(/(\d)[ \t\u00A0]+%/g, "$1%"));
        return applyTypographyRule(ruleAnalyticsCollector, "space_tilde", text, (value) => value.replace(/~[ \t\u00A0]+(?=[A-Za-zА-Яа-яЁё\d])/g, "~"));
    }
    catch (error) {
        console.error("[Чистовик] Failed to clean spaces", error);
        throw error;
    }
}
function cleanupQuotesAndPunctuation(input, ruleAnalyticsCollector = null) {
    try {
        let text = applyTypographyRule(ruleAnalyticsCollector, "punctuation_ellipsis", input, (value) => value.replace(/\.{3}/g, "…"));
        if (/(?:…["'»“”]|["'»“”]…)/.test(text)) {
            recordTypographyRuleObservation(ruleAnalyticsCollector, "quote_ellipsis_position");
        }
        text = applyTypographyRule(ruleAnalyticsCollector, "punctuation_repeated_marks", text, (value) => value.replace(/!{2,}/g, "!").replace(/\?{2,}/g, "?"));
        text = applyTypographyRule(ruleAnalyticsCollector, "punctuation_question_exclamation_order", text, (value) => value.replace(/!\?/g, "?!"));
        text = applyTypographyRule(ruleAnalyticsCollector, "quote_context_script", text, (value) => formatQuotes(value, ruleAnalyticsCollector));
        text = applyTypographyRule(ruleAnalyticsCollector, "quote_question_exclamation", text, (value) => value
            .replace(/([»“"'])([?!])/g, "$2$1")
            .replace(/([?!](?:[»“"']+))\./g, "$1"));
        text = applyTypographyRule(ruleAnalyticsCollector, "quote_punctuation_outside", text, (value) => value.replace(/([.,;:])([»“"'])/g, "$2$1"));
        return applyTypographyRule(ruleAnalyticsCollector, "space_before_punctuation", text, (value) => value.replace(/[ \t\u00A0]+([.,;:?!…])/g, "$1"));
    }
    catch (error) {
        console.error("[Чистовик] Failed to clean quotes and punctuation", error);
        throw error;
    }
}
function formatQuotes(input, ruleAnalyticsCollector = null) {
    var _a;
    try {
        const stack = [];
        let result = "";
        for (let index = 0; index < input.length; index += 1) {
            const char = input[index];
            if (!isQuoteChar(char) || isApostropheInsideWord(input, index)) {
                result += char;
                continue;
            }
            const opening = getQuoteRole(input, index, stack) === "opening";
            if (opening) {
                const script = stack.length === 0 ? detectTopLevelQuoteScript(input, index) : stack[stack.length - 1].script;
                const level = stack.length;
                const quote = getOpeningQuote(script, level);
                stack.push({ script, level });
                result += quote;
                if (quote !== char) {
                    recordTypographyRuleDerivedChange(ruleAnalyticsCollector, script === "latin" ? "quote_latin_levels" : "quote_ru_levels");
                }
            }
            else {
                const state = (_a = stack.pop()) !== null && _a !== void 0 ? _a : {
                    script: detectTopLevelQuoteScript(input, index),
                    level: 0,
                };
                const quote = getClosingQuote(state.script, state.level);
                result += quote;
                if (quote !== char) {
                    recordTypographyRuleDerivedChange(ruleAnalyticsCollector, state.script === "latin" ? "quote_latin_levels" : "quote_ru_levels");
                }
            }
        }
        return result;
    }
    catch (error) {
        console.error("[Чистовик] Failed to format quotes", error);
        throw error;
    }
}
function isQuoteChar(char) {
    try {
        return char === '"' || char === "'" || char === "«" || char === "»" || char === "„" || char === "“" || char === "”" || char === "‘" || char === "’";
    }
    catch (error) {
        console.error("[Чистовик] Failed to check quote char", error);
        throw error;
    }
}
function isApostropheInsideWord(input, index) {
    var _a, _b;
    try {
        const char = input[index];
        if (char !== "'" && char !== "’") {
            return false;
        }
        return isLetter((_a = input[index - 1]) !== null && _a !== void 0 ? _a : "") && isLetter((_b = input[index + 1]) !== null && _b !== void 0 ? _b : "");
    }
    catch (error) {
        console.error("[Чистовик] Failed to check apostrophe context", error);
        throw error;
    }
}
function getQuoteRole(input, index, stack) {
    var _a;
    try {
        const prev = (_a = input[index - 1]) !== null && _a !== void 0 ? _a : "";
        const next = nextVisibleChar(input, index);
        if (!next) {
            return "closing";
        }
        if (stack.length > 0 && isQuoteClosingContext(input, index)) {
            return "closing";
        }
        if (isQuoteOpeningContext(prev)) {
            return "opening";
        }
        if (isQuoteClosingContext(input, index)) {
            return "closing";
        }
        return "opening";
    }
    catch (error) {
        console.error("[Чистовик] Failed to detect quote role", error);
        throw error;
    }
}
function isQuoteOpeningContext(previous) {
    try {
        return previous === "" || /[ \t\u00A0\n\r*([{<«„“‘"'—–-]/.test(previous);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check quote opening context", error);
        throw error;
    }
}
function isQuoteClosingContext(input, index) {
    var _a;
    try {
        const previous = previousVisibleChar(input, index);
        const next = (_a = input[index + 1]) !== null && _a !== void 0 ? _a : "";
        if (previous === null) {
            return false;
        }
        return next === "" || /[ \t\u00A0\n\r*.,;:?!…)\]}»“"']/.test(next);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check quote closing context", error);
        throw error;
    }
}
function detectTopLevelQuoteScript(input, index) {
    var _a;
    try {
        const line = getLineAtIndex(input, index);
        const textOutsideQuotes = getTextOutsideQuotesForScriptDetection(line);
        const outsideScript = detectDominantQuoteScript(textOutsideQuotes);
        if (outsideScript !== null) {
            return outsideScript;
        }
        return (_a = detectDominantQuoteScript(line)) !== null && _a !== void 0 ? _a : "latin";
    }
    catch (error) {
        console.error("[Чистовик] Failed to detect top-level quote script", error);
        throw error;
    }
}
function getLineAtIndex(input, index) {
    try {
        const lineStart = input.lastIndexOf("\n", index - 1) + 1;
        const nextLineBreak = input.indexOf("\n", index);
        const lineEnd = nextLineBreak === -1 ? input.length : nextLineBreak;
        return input.slice(lineStart, lineEnd);
    }
    catch (error) {
        console.error("[Чистовик] Failed to get line at index", error);
        throw error;
    }
}
function detectDominantQuoteScript(input) {
    try {
        const latinCount = countMatches(input, /[A-Za-z]/g);
        const cyrillicCount = countMatches(input, /[А-Яа-яЁё]/g);
        if (latinCount === 0 && cyrillicCount === 0) {
            return null;
        }
        return latinCount > cyrillicCount ? "latin" : "cyrillic";
    }
    catch (error) {
        console.error("[Чистовик] Failed to detect dominant quote script", error);
        throw error;
    }
}
function getTextOutsideQuotesForScriptDetection(input) {
    try {
        const stack = [];
        let result = "";
        for (let index = 0; index < input.length; index += 1) {
            const char = input[index];
            if (!isQuoteChar(char) || isApostropheInsideWord(input, index)) {
                if (stack.length === 0) {
                    result += char;
                }
                continue;
            }
            const opening = getQuoteRole(input, index, stack) === "opening";
            if (opening) {
                stack.push({ script: "latin", level: stack.length });
            }
            else {
                stack.pop();
            }
        }
        return result;
    }
    catch (error) {
        console.error("[Чистовик] Failed to get text outside quotes for script detection", error);
        throw error;
    }
}
function getTextOutsideQuotes(input) {
    try {
        const stack = [];
        let result = "";
        for (let index = 0; index < input.length; index += 1) {
            const char = input[index];
            if (!isQuoteChar(char) || isApostropheInsideWord(input, index)) {
                if (stack.length === 0) {
                    result += char;
                }
                continue;
            }
            const opening = getQuoteRole(input, index, stack) === "opening";
            if (opening) {
                stack.push({ script: "cyrillic", level: stack.length });
            }
            else {
                stack.pop();
            }
        }
        return result;
    }
    catch (error) {
        console.error("[Чистовик] Failed to get text outside quotes", error);
        throw error;
    }
}
function getOpeningQuote(script, level) {
    try {
        if (script === "latin") {
            return level % 2 === 0 ? '"' : "'";
        }
        return level % 2 === 0 ? "«" : "„";
    }
    catch (error) {
        console.error("[Чистовик] Failed to get opening quote", error);
        throw error;
    }
}
function getClosingQuote(script, level) {
    try {
        if (script === "latin") {
            return level % 2 === 0 ? '"' : "'";
        }
        return level % 2 === 0 ? "»" : "“";
    }
    catch (error) {
        console.error("[Чистовик] Failed to get closing quote", error);
        throw error;
    }
}
function cleanupDashesAndHyphens(input, ruleAnalyticsCollector = null) {
    try {
        let text = applyTypographyRule(ruleAnalyticsCollector, "hyphen_nonbreaking_words", input, restoreSpacedHyphenatedWords);
        text = normalizeEditorialRanges(text, ruleAnalyticsCollector);
        text = applyTypographyRule(ruleAnalyticsCollector, "dash_line_start", text, (value) => value.replace(/^([ \t\u00A0]*)([-–])(?=[ \t\u00A0])/gm, `$1${EM_DASH}`));
        text = applyTypographyRule(ruleAnalyticsCollector, "dash_between_words", text, (value) => value
            .replace(/([^ \t\u00A0\n\r\d])[ \t\u00A0]+[-–][ \t\u00A0]+([A-Za-zА-Яа-яЁё])/g, `$1 ${EM_DASH} $2`)
            .replace(/([A-Za-zА-Яа-яЁё])[ \t\u00A0]+[-–][ \t\u00A0]+([A-Za-zА-Яа-яЁё])/g, `$1 ${EM_DASH} $2`));
        return applyTypographyRule(ruleAnalyticsCollector, "hyphen_nonbreaking_words", text, (value) => value.replace(/([A-Za-zА-Яа-яЁё])-([A-Za-zА-Яа-яЁё])/g, `$1${NB_HYPHEN}$2`));
    }
    catch (error) {
        console.error("[Чистовик] Failed to clean dashes and hyphens", error);
        throw error;
    }
}
function restoreSpacedHyphenatedWords(input) {
    try {
        const patterns = [
            [new RegExp(`(^|[^${LETTERS}])(из)[ \\t\\u00A0]+(за)(?=$|[^${LETTERS}])`, "gi"), "$1$2-$3"],
            [new RegExp(`(^|[^${LETTERS}])(из)[ \\t\\u00A0]+(под)(?=$|[^${LETTERS}])`, "gi"), "$1$2-$3"],
            [new RegExp(`(^|[^${LETTERS}])(кто)[ \\t\\u00A0]+(то)(?=$|[^${LETTERS}])`, "gi"), "$1$2-$3"],
            [new RegExp(`(^|[^${LETTERS}])(что)[ \\t\\u00A0]+(либо)(?=$|[^${LETTERS}])`, "gi"), "$1$2-$3"],
            [new RegExp(`(^|[^${LETTERS}])(где)[ \\t\\u00A0]+(нибудь)(?=$|[^${LETTERS}])`, "gi"), "$1$2-$3"],
            [new RegExp(`(^|[^${LETTERS}])(кое)[ \\t\\u00A0]+(как)(?=$|[^${LETTERS}])`, "gi"), "$1$2-$3"],
            [new RegExp(`(^|[^${LETTERS}])(все|всё)[ \\t\\u00A0]+(таки)(?=$|[^${LETTERS}])`, "gi"), "$1$2-$3"],
        ];
        let text = input;
        for (const [pattern, replacement] of patterns) {
            text = text.replace(pattern, replacement);
        }
        return text;
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore spaced hyphenated words", error);
        throw error;
    }
}
function normalizeEditorialRanges(input, ruleAnalyticsCollector = null) {
    try {
        let text = input;
        const month = "января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря";
        const year = `[12][ \\t\\u00A0]?\\d{3}`;
        const wordDate = `\\d{1,2}[ \\t\\u00A0]+(?:${month})(?:[ \\t\\u00A0]+${year}(?:[ \\t\\u00A0]+(?:г\\.?|года|году))?)?`;
        const quarterDate = `[IVXLCDM]+[ \\t\\u00A0]+квартал[ \\t\\u00A0]+${year}`;
        const compoundRangeInput = text;
        text = applyTypographyRule(ruleAnalyticsCollector, "range_compound_grouped_number", text, (value) => value.replace(/(^|[^\d])(\d{1,3}(?:[ \t\u00A0]\d{3})+)[ \t\u00A0]*[-–—−][ \t\u00A0]*(\d{1,3}(?:[ \t\u00A0]\d{3})+)(?=$|[^\d])/g, "$1$2 — $3"));
        text = applyTypographyRule(ruleAnalyticsCollector, "range_compound_full_date", text, (value) => value.replace(/(^|[^\d.])(\d{1,2}\.\d{1,2}\.\d{2,4})[ \t\u00A0]*[-–—−][ \t\u00A0]*(\d{1,2}\.\d{1,2}\.\d{2,4})(?=$|[^\d])/g, "$1$2 — $3"));
        text = applyTypographyRule(ruleAnalyticsCollector, "range_compound_word_date", text, (value) => value.replace(new RegExp(`(^|[^${LETTERS}\\d])(${wordDate})[ \\t\\u00A0]*[-–—−][ \\t\\u00A0]*(${wordDate})(?=$|[^${LETTERS}\\d])`, "gi"), (_match, prefix, start, end) => `${prefix}${normalizeSpacedYearInRangeBoundary(start)} ${EM_DASH} ${normalizeSpacedYearInRangeBoundary(end)}`));
        text = applyTypographyRule(ruleAnalyticsCollector, "range_compound_quarter", text, (value) => value.replace(new RegExp(`(^|[^${LETTERS}\\d])(${quarterDate})[ \\t\\u00A0]*[-–—−][ \\t\\u00A0]*(${quarterDate})(?=$|[^${LETTERS}\\d])`, "gi"), (_match, prefix, start, end) => `${prefix}${normalizeSpacedYearInRangeBoundary(start)} ${EM_DASH} ${normalizeSpacedYearInRangeBoundary(end)}`));
        text = applyTypographyRule(ruleAnalyticsCollector, "range_compound_open_year", text, (value) => value.replace(/(^|[^\d])(\d{4})[ \t\u00A0]*[-–—−][ \t\u00A0]*(н\.[ \t\u00A0]*в\.|наст\.[ \t\u00A0]*вр\.)(?=$|[^A-Za-zА-Яа-яЁё\d])/gi, (_match, prefix, start, end) => `${prefix}${start} ${EM_DASH} ${end.replace(/[ \t\u00A0]+/g, " ")}`));
        if (text !== compoundRangeInput) {
            recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "range_compound");
        }
        text = applyTypographyRule(ruleAnalyticsCollector, "temperature_range", text, (value) => value.replace(/(^|[^\d,+−-])([+−-]\d+(?:[.,]\d+)?)[ \t\u00A0]*(?:\.{3}|…|[-–—−])[ \t\u00A0]*([+−-]\d+(?:[.,]\d+)?)[ \t\u00A0]*°?[ \t\u00A0]*([CFС])(?=$|[^A-Za-zА-Яа-яЁё])/g, (_match, prefix, start, end, unit) => `${prefix}${normalizeTemperatureSign(start)}…${normalizeTemperatureSign(end)}${NBSP}°${unit === "F" ? "F" : "C"}`));
        text = applyTypographyRule(ruleAnalyticsCollector, "percent_range", text, (value) => value.replace(/(^|[^\d,])(\d+(?:,\d+)?)%[-–—−](\d+(?:,\d+)?)%(?=$|[^\d,])/g, "$1$2—$3%"));
        const simpleRangeInput = text;
        text = applyTypographyRule(ruleAnalyticsCollector, "range_simple_time", text, (value) => value.replace(/(^|[^\d:])(\d{1,2}:\d{2})[ \t\u00A0]*[-–—−][ \t\u00A0]*(\d{1,2}:\d{2})(?=$|[^\d:])/g, "$1$2—$3"));
        text = applyTypographyRule(ruleAnalyticsCollector, "range_simple_short_date", text, (value) => value.replace(/(^|[^\d.])(\d{1,2}\.\d{1,2})(?!\.\d)[ \t\u00A0]*[-–—−][ \t\u00A0]*(\d{1,2}\.\d{1,2})(?!\.\d)(?=$|[^\d])/g, "$1$2—$3"));
        text = applyTypographyRule(ruleAnalyticsCollector, "range_simple_roman", text, (value) => value.replace(/(^|[^A-Za-zА-Яа-яЁё])([IVXLCDM]+)[ \t\u00A0]*[-–—−][ \t\u00A0]*([IVXLCDM]+)(?=$|[^A-Za-zА-Яа-яЁё\d])/g, (match, prefix, startRoman, endRoman, offset, fullText) => {
            try {
                const rangeStart = offset + prefix.length;
                const rangeEnd = rangeStart + match.length - prefix.length;
                if (isProtectedRomanRange(fullText, rangeStart, rangeEnd) || !hasRomanRangeContext(fullText, rangeStart, rangeEnd)) {
                    return match;
                }
                return `${prefix}${startRoman}${EM_DASH}${endRoman}`;
            }
            catch (error) {
                console.error("[Чистовик] Failed to normalize editorial roman range", error);
                return match;
            }
        }));
        text = applyTypographyRule(ruleAnalyticsCollector, "range_simple_number", text, (value) => value.replace(/(^|[^\d.,:])(\d+(?:[.,]\d+)?)[ \t\u00A0]*[-–—−][ \t\u00A0]*(\d+(?:[.,]\d+)?)(?=$|[^\d.,:])/g, (match, prefix, startNumber, endNumber, offset, fullText) => {
            try {
                const rangeStart = offset + prefix.length;
                const rangeEnd = rangeStart + match.length - prefix.length;
                if (isProtectedNumericRange(fullText, rangeStart, rangeEnd) || isGroupedNumberFragment(fullText, rangeStart, rangeEnd)) {
                    return match;
                }
                if (/^[ \t\u00A0]+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?=$|[^A-Za-zА-Яа-яЁё])/i.test(fullText.slice(rangeEnd))) {
                    recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "range_simple_word_date");
                }
                return `${prefix}${startNumber}${EM_DASH}${endNumber}`;
            }
            catch (error) {
                console.error("[Чистовик] Failed to normalize editorial numeric range", error);
                return match;
            }
        }));
        if (text !== simpleRangeInput) {
            recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "range_simple");
        }
        return text;
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize editorial ranges", error);
        throw error;
    }
}
function isGroupedNumberFragment(fullText, start, end) {
    var _a, _b, _c, _d;
    try {
        const previous = (_a = fullText[start - 1]) !== null && _a !== void 0 ? _a : "";
        const previousPrevious = (_b = fullText[start - 2]) !== null && _b !== void 0 ? _b : "";
        const next = (_c = fullText[end]) !== null && _c !== void 0 ? _c : "";
        const nextNext = (_d = fullText[end + 1]) !== null && _d !== void 0 ? _d : "";
        return ((previous === " " || previous === NBSP) && /\d/.test(previousPrevious)) || ((next === " " || next === NBSP) && /\d/.test(nextNext));
    }
    catch (error) {
        console.error("[Чистовик] Failed to check grouped number fragment", error);
        throw error;
    }
}
function normalizeSpacedYearInRangeBoundary(input) {
    try {
        return input.replace(/\b([12])[ \t\u00A0](\d{3})\b/g, "$1$2");
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize spaced year in range boundary", error);
        throw error;
    }
}
function normalizeTemperatureSign(input) {
    try {
        return input.replace(/^-/, MINUS);
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize temperature sign", error);
        throw error;
    }
}
function isProtectedNumericRange(fullText, start, end) {
    var _a, _b;
    try {
        if (isInsideProtectedToken(fullText, start, end)) {
            return true;
        }
        const previous = previousNonSpaceSkippingDevelopmentMarker(fullText, start);
        if (previous === "№" || previous === "§" || isNumberAfterSignNumberPrefix(fullText, start)) {
            return true;
        }
        if (isWordDateRangeNumericFragment(fullText, start, end)) {
            return true;
        }
        return isCodeTokenNeighbor((_a = fullText[start - 1]) !== null && _a !== void 0 ? _a : "") || isCodeTokenNeighbor((_b = fullText[end]) !== null && _b !== void 0 ? _b : "");
    }
    catch (error) {
        console.error("[Чистовик] Failed to check protected numeric range", error);
        throw error;
    }
}
function isWordDateRangeNumericFragment(fullText, start, end) {
    try {
        const month = "января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря";
        const before = fullText.slice(Math.max(0, start - 24), start);
        const after = fullText.slice(end, Math.min(fullText.length, end + 24));
        const monthBefore = new RegExp(`(?:${month})[ \\t\\u00A0]+$`, "i");
        const monthAfter = new RegExp(`^[ \\t\\u00A0]+(?:${month})(?=$|[^${LETTERS}])`, "i");
        return monthBefore.test(before) && monthAfter.test(after);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check word date range numeric fragment", error);
        throw error;
    }
}
function isProtectedRomanRange(fullText, start, end) {
    try {
        if (isInsidePhoneNumberCandidate(fullText, start, end)) {
            return true;
        }
        const bounds = getLooseTokenBounds(fullText, start, end);
        const token = fullText.slice(bounds.start, bounds.end);
        if (/^[A-Za-z][A-Za-z\d+.-]*:\/\//.test(token) || /^www\./i.test(token) || token.includes("@") || token.includes("_")) {
            return true;
        }
        if (/\d/.test(token) || hasProtectedRomanRangeTokenLetters(token)) {
            return true;
        }
        return false;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check protected roman range", error);
        throw error;
    }
}
function hasRomanRangeContext(fullText, start, end) {
    try {
        return hasRomanRangeContextBefore(fullText, start) || hasRomanRangeContextAfter(fullText, end);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check roman range context", error);
        throw error;
    }
}
function hasRomanRangeContextBefore(fullText, start) {
    try {
        const before = fullText.slice(0, start).toLowerCase();
        const match = /(^|[^А-Яа-яЁё])(век|века|веках|веков|глава|главы|глав|часть|части|частей|раздел|разделы|разделов|пункт|пункты|пунктов|квартал|кварталы|кварталов|кв\.|том|тома|томов|параграф|параграфы|параграфов)[ \t\u00A0]*$/.exec(before);
        return match !== null;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check roman range context before", error);
        throw error;
    }
}
function hasRomanRangeContextAfter(fullText, end) {
    try {
        const after = fullText.slice(end).toLowerCase();
        const match = /^[ \t\u00A0]*(век|века|веках|веков|глава|главы|глав|часть|части|частей|раздел|разделы|разделов|пункт|пункты|пунктов|квартал|кварталы|кварталов|кв\.|том|тома|томов|параграф|параграфы|параграфов)(?=$|[^А-Яа-яЁё])/.exec(after);
        return match !== null;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check roman range context after", error);
        throw error;
    }
}
function hasProtectedRomanRangeTokenLetters(token) {
    try {
        for (const char of token) {
            if (isLetter(char) && !/[IVXLCDM]/.test(char)) {
                return true;
            }
        }
        return false;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check protected roman range token letters", error);
        throw error;
    }
}
function formatPhoneNumbers(input, ruleAnalyticsCollector = null) {
    try {
        let text = applyTypographyRule(ruleAnalyticsCollector, "phone_ru_format", input, (value) => value.replace(/^([ \t\u00A0]*)(9\d{2})[ \t\u00A0.\-–—‑]*(\d{3})[ \t\u00A0.\-–—‑]*(\d{2})[ \t\u00A0.\-–—‑]*(\d{2})([ \t\u00A0]*)$/, (match, prefix, operator, first, second, third, suffix) => {
            const replacement = `${prefix}${operator}${NBSP}${first}${NB_HYPHEN}${second}${NB_HYPHEN}${third}${suffix}`;
            if (replacement !== match) {
                recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "phone_ru_separators");
            }
            return replacement;
        }));
        const phoneCandidate = /(^|[^\d])((?:\+[ \t\u00A0]*)?[78](?:[ \t\u00A0().\-–—‑]*\d){10})(?![ \t\u00A0().\-–—‑]*\d)(?![ \t\u00A0]*[₽$€])/g;
        text = applyTypographyRule(ruleAnalyticsCollector, "phone_ru_format", text, (value) => value.replace(phoneCandidate, (match, prefix, candidate, offset, fullText) => {
            try {
                const candidateStart = offset + prefix.length;
                if (previousNonSpaceSkippingDevelopmentMarker(fullText, candidateStart) === "№" || isInsideProtectedNumericIdentifier(fullText, candidateStart, candidateStart + candidate.length)) {
                    recordTypographyRuleObservation(ruleAnalyticsCollector, "phone_protected_contexts");
                    return match;
                }
                const candidateEnd = candidateStart + candidate.length;
                const next = nextNonSpace(fullText, candidateEnd);
                if (next === "₽" || next === "$" || next === "€") {
                    recordTypographyRuleObservation(ruleAnalyticsCollector, "phone_protected_contexts");
                    return match;
                }
                const digits = candidate.replace(/\D/g, "");
                if (digits.length !== 11 || (digits[0] !== "7" && digits[0] !== "8")) {
                    return match;
                }
                const country = digits[0] === "8" ? "8" : "+7";
                const operator = digits.slice(1, 4);
                const first = digits.slice(4, 7);
                const second = digits.slice(7, 9);
                const third = digits.slice(9, 11);
                const replacement = `${prefix}${country}${NBSP}${operator}${NBSP}${first}${NB_HYPHEN}${second}${NB_HYPHEN}${third}`;
                if (replacement !== match) {
                    recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "phone_ru_separators");
                    recordTypographyRuleDerivedChange(ruleAnalyticsCollector, digits[0] === "8" ? "phone_ru_prefix_eight" : "phone_ru_prefix_seven");
                }
                return replacement;
            }
            catch (error) {
                console.error("[Чистовик] Failed to format phone candidate", error);
                return match;
            }
        }));
        return text;
    }
    catch (error) {
        console.error("[Чистовик] Failed to format phone numbers", error);
        throw error;
    }
}
function formatNumbersAndMoney(input, ruleAnalyticsCollector = null) {
    try {
        let text = applyTypographyRule(ruleAnalyticsCollector, "number_protect_date", input, normalizeCommaSeparatedDates);
        text = applyTypographyRule(ruleAnalyticsCollector, "number_document_outline", text, normalizeDottedNumberingSeparators);
        text = applyTypographyRule(ruleAnalyticsCollector, "number_western_format", text, normalizeWesternGroupedNumbers);
        text = applyTypographyRule(ruleAnalyticsCollector, "number_decimal_comma", text, (value) => value.replace(/\b(\d+)\.(\d+)\b/g, (match, integerPart, decimalPart, offset, fullText) => {
            try {
                if (isProtectedDottedNumber(fullText, offset, offset + match.length)) {
                    recordProtectedDottedNumberRuleObservations(ruleAnalyticsCollector, fullText, offset, offset + match.length);
                    return match;
                }
                return `${integerPart},${decimalPart}`;
            }
            catch (error) {
                console.error("[Чистовик] Failed to format decimal number", error);
                return match;
            }
        }));
        text = applyTypographyRule(ruleAnalyticsCollector, "number_group_digits", text, (value) => value.replace(/\b\d{4,}(?:,\d+)?\b/g, (match, offset, fullText) => {
            try {
                const [integerPart, decimalPart] = match.split(",");
                if (isNumberPartOfDate(fullText, offset, offset + integerPart.length) || shouldSkipNumberGrouping(fullText, offset, offset + integerPart.length, integerPart)) {
                    recordProtectedGroupedNumberRuleObservations(ruleAnalyticsCollector, fullText, offset, offset + integerPart.length);
                    return match;
                }
                return `${groupLongNumber(integerPart)}${decimalPart === undefined ? "" : `,${decimalPart}`}`;
            }
            catch (error) {
                console.error("[Чистовик] Failed to group number", error);
                return match;
            }
        }));
        text = applyTypographyRule(ruleAnalyticsCollector, "number_group_digits", text, normalizeGroupedNumberSpaces);
        text = applyTypographyRule(ruleAnalyticsCollector, "number_unit_currency_nbsp", text, (value) => value.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?)[ \t\u00A0]*(₽|\$|€|км|кг|м)(?=$|[^A-Za-zА-Яа-яЁё])/g, `$1${NBSP}$2`));
        text = applyTypographyRule(ruleAnalyticsCollector, "number_unit_currency_nbsp", text, normalizeTechnicalMeasurementUnits);
        return applyTypographyRule(ruleAnalyticsCollector, "year_context", text, normalizeSpacedYears);
    }
    catch (error) {
        console.error("[Чистовик] Failed to format numbers and money", error);
        throw error;
    }
}
function normalizeTechnicalMeasurementUnits(input) {
    try {
        return input.replace(/(^|[^A-Za-zА-Яа-яЁё\d.,])(\d(?:[\d \u00A0]*\d)?(?:,\d+)?)[ \t\u00A0]*(квт|вт|в|dpi|lpi)(?=$|[^A-Za-zА-Яа-яЁё\d])/gi, (_match, prefix, number, unit) => {
            try {
                return `${prefix}${number}${NBSP}${getCanonicalTechnicalMeasurementUnit(unit)}`;
            }
            catch (error) {
                console.error("[Чистовик] Failed to normalize technical measurement unit candidate", error);
                return _match;
            }
        });
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize technical measurement units", error);
        throw error;
    }
}
function getCanonicalTechnicalMeasurementUnit(unit) {
    try {
        switch (unit.toLowerCase()) {
            case "в":
                return "В";
            case "вт":
                return "Вт";
            case "квт":
                return "кВт";
            case "dpi":
                return "dpi";
            case "lpi":
                return "lpi";
            default:
                return unit;
        }
    }
    catch (error) {
        console.error("[Чистовик] Failed to get canonical technical measurement unit", error);
        throw error;
    }
}
function normalizeCommaSeparatedDates(input) {
    try {
        return input.replace(/(^|[^A-Za-zА-Яа-яЁё\d.,])(\d{1,2}),(\d{2}),([12]\d{3})(?![\d,]|\.\d|[A-Za-zА-Яа-яЁё])/g, (match, prefix, day, month, year) => {
            try {
                if (!isValidCalendarDate(Number(day), Number(month), Number(year))) {
                    return match;
                }
                return `${prefix}${day}.${month}.${year}`;
            }
            catch (error) {
                console.error("[Чистовик] Failed to normalize comma-separated date candidate", error);
                return match;
            }
        });
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize comma-separated dates", error);
        throw error;
    }
}
function isValidCalendarDate(day, month, year) {
    try {
        if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year) || year < 1000 || year > 2999 || month < 1 || month > 12 || day < 1) {
            return false;
        }
        const leapYear = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
        const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return day <= daysInMonth[month - 1];
    }
    catch (error) {
        console.error("[Чистовик] Failed to validate calendar date", error);
        throw error;
    }
}
function normalizeDottedNumberingSeparators(input) {
    try {
        return input.replace(/\b\d+(?:,\d+)+\b/g, (match, offset, fullText) => {
            try {
                if (!isDottedNumbering(fullText, offset, offset + match.length)) {
                    return match;
                }
                return match.replace(/,/g, ".");
            }
            catch (error) {
                console.error("[Чистовик] Failed to restore dotted numbering separator", error);
                return match;
            }
        });
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore dotted numbering separators", error);
        throw error;
    }
}
function normalizeWesternGroupedNumbers(input) {
    try {
        return input.replace(/(^|[^\d])(\d{1,3}(?:,\d{3})+(?:\.\d+)?)(?=$|[^\d])/g, (match, prefix, candidate, offset, fullText) => {
            try {
                const candidateStart = offset + prefix.length;
                const [integerPart, decimalPart] = candidate.split(".");
                const compactInteger = integerPart.replace(/,/g, "");
                if (shouldSkipNumberGrouping(fullText, candidateStart, candidateStart + integerPart.length, compactInteger)) {
                    return match;
                }
                return `${prefix}${integerPart.replace(/,/g, NBSP)}${decimalPart === undefined ? "" : `,${decimalPart}`}`;
            }
            catch (error) {
                console.error("[Чистовик] Failed to normalize western grouped number candidate", error);
                return match;
            }
        });
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize western grouped numbers", error);
        throw error;
    }
}
function normalizeGroupedNumberSpaces(input) {
    try {
        return input.replace(/\b\d{1,3}(?:[ \t\u00A0]\d{3})+(?:,\d+)?\b/g, (match, offset, fullText) => {
            try {
                const compactInteger = match.split(",")[0].replace(/[ \t\u00A0]/g, "");
                if (shouldSkipNumberGrouping(fullText, offset, offset + match.length, compactInteger)) {
                    return match;
                }
                return match.replace(/[ \t\u00A0](?=\d{3}(?:[ \t\u00A0,]|$))/g, NBSP);
            }
            catch (error) {
                console.error("[Чистовик] Failed to normalize grouped number candidate", error);
                return match;
            }
        });
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize grouped number spaces", error);
        throw error;
    }
}
function isProtectedDottedNumber(fullText, start, end) {
    try {
        if (isNumberPartOfCodeToken(fullText, start, end) ||
            isNumberInsideDateLikeToken(fullText, start, end) ||
            isNumberPartOfDate(fullText, start, end) ||
            isDottedNumbering(fullText, start, end)) {
            return true;
        }
        let tokenStart = start;
        let tokenEnd = end;
        while (tokenStart > 0 && /[A-Za-zА-Яа-яЁё\d.]/.test(fullText[tokenStart - 1])) {
            tokenStart -= 1;
        }
        while (tokenEnd < fullText.length && /[A-Za-zА-Яа-яЁё\d.]/.test(fullText[tokenEnd])) {
            tokenEnd += 1;
        }
        const token = fullText.slice(tokenStart, tokenEnd);
        const dotCount = countMatches(token, /\./g);
        return dotCount > 1 || /[A-Za-zА-Яа-яЁё]/.test(token);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check dotted number exception", error);
        throw error;
    }
}
function recordProtectedDottedNumberRuleObservations(collector, fullText, start, end) {
    try {
        const bounds = getLooseTokenBounds(fullText, start, end);
        const token = fullText.slice(bounds.start, bounds.end);
        if (/[A-Za-zА-Яа-яЁё]/.test(token) && countMatches(token, /\./g) > 1) {
            recordTypographyRuleObservation(collector, "number_protect_version");
            return;
        }
        if (isNumberPartOfCodeToken(fullText, start, end)) {
            recordTypographyRuleObservation(collector, "number_protect_code");
            return;
        }
        if (isNumberInsideDateLikeToken(fullText, start, end) || isNumberPartOfDate(fullText, start, end)) {
            recordTypographyRuleObservation(collector, "number_protect_date");
            return;
        }
        if (countMatches(token, /\./g) > 1) {
            recordTypographyRuleObservation(collector, "number_protect_ip");
        }
    }
    catch (_a) {
        // Rule analytics must never affect typography.
    }
}
function recordProtectedGroupedNumberRuleObservations(collector, fullText, start, end) {
    try {
        if (isNumberPartOfCodeToken(fullText, start, end)) {
            recordTypographyRuleObservation(collector, "number_protect_code");
        }
        if (isNumberInsideDateLikeToken(fullText, start, end) || isNumberInsideFullDate(fullText, start, end) || isNumberPartOfDate(fullText, start, end)) {
            recordTypographyRuleObservation(collector, "number_protect_date");
        }
        const previous = previousNonSpaceSkippingDevelopmentMarker(fullText, start);
        if (previous === "№" || previous === "§" || isNumberAfterSignNumberPrefix(fullText, start)) {
            recordTypographyRuleObservation(collector, "number_protect_sign");
        }
    }
    catch (_a) {
        // Rule analytics must never affect typography.
    }
}
function isNumberInsideDateLikeToken(fullText, start, end) {
    try {
        let tokenStart = start;
        let tokenEnd = end;
        while (tokenStart > 0 && /[\d.,]/.test(fullText[tokenStart - 1])) {
            tokenStart -= 1;
        }
        while (tokenEnd < fullText.length && /[\d.,]/.test(fullText[tokenEnd])) {
            tokenEnd += 1;
        }
        const token = fullText.slice(tokenStart, tokenEnd);
        return /^\d{1,2}[.,]\d{1,2}[.,][12]\d{3}(?:[.,]\d+)*$/.test(token);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check date-like numeric token", error);
        throw error;
    }
}
function isDottedNumbering(fullText, start, end) {
    try {
        const textBeforeNumber = fullText.slice(0, start);
        const documentNumberingContext = /(?:^|[^A-Za-zА-Яа-яЁё])(?:раздел|подраздел|глава|пункт|подпункт|статья|часть|гл\.?|п\.?|ст\.?|ч\.?|§|№)[ \t\u00A0]*$/i;
        if (documentNumberingContext.test(textBeforeNumber)) {
            return !isFollowedByDecimalUnitOrCurrency(fullText, end);
        }
        const lineStart = Math.max(fullText.lastIndexOf("\n", start - 1), fullText.lastIndexOf("\r", start - 1)) + 1;
        const textBeforeNumberOnLine = fullText.slice(lineStart, start);
        const textAfterNumber = fullText.slice(end);
        const startsLine = /^[ \t\u00A0]*$/.test(textBeforeNumberOnLine);
        const followedByHeading = /^[ \t\u00A0]+[А-ЯЁA-Z]/.test(textAfterNumber);
        if (!startsLine || !followedByHeading) {
            return false;
        }
        return !isFollowedByDecimalUnitOrCurrency(fullText, end);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check dotted numbering", error);
        throw error;
    }
}
function isNumberPartOfDate(fullText, start, end) {
    try {
        const bounds = getDottedNumberTokenBounds(fullText, start, end);
        if (bounds === null) {
            return false;
        }
        const token = fullText.slice(bounds.start, bounds.end);
        if (isShortDateToken(token) && isFollowedByDecimalUnitOrCurrency(fullText, bounds.end)) {
            return false;
        }
        return isDateToken(token);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check date token", error);
        throw error;
    }
}
function getDottedNumberTokenBounds(fullText, start, end) {
    try {
        let tokenStart = start;
        let tokenEnd = end;
        while (tokenStart > 0 && /[\d.]/.test(fullText[tokenStart - 1])) {
            tokenStart -= 1;
        }
        while (tokenEnd < fullText.length && /[\d.]/.test(fullText[tokenEnd])) {
            tokenEnd += 1;
        }
        if (tokenStart > 0 && /[A-Za-zА-Яа-яЁё\d.]/.test(fullText[tokenStart - 1])) {
            return null;
        }
        if (tokenEnd < fullText.length && /[A-Za-zА-Яа-яЁё\d.]/.test(fullText[tokenEnd])) {
            return null;
        }
        return { start: tokenStart, end: tokenEnd };
    }
    catch (error) {
        console.error("[Чистовик] Failed to get dotted number token bounds", error);
        throw error;
    }
}
function isDateToken(token) {
    try {
        const match = /^(\d{1,2})\.(\d{2})(?:\.(\d{4}))?$/.exec(token);
        if (match === null) {
            return false;
        }
        const day = Number(match[1]);
        const month = Number(match[2]);
        const year = match[3] === undefined ? null : Number(match[3]);
        return day >= 1 && day <= 31 && month >= 1 && month <= 12 && (year === null || (year >= 1000 && year <= 2999));
    }
    catch (error) {
        console.error("[Чистовик] Failed to check date token format", error);
        throw error;
    }
}
function isShortDateToken(token) {
    try {
        return /^\d{1,2}\.\d{2}$/.test(token) && isDateToken(token);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check short date token", error);
        throw error;
    }
}
function isFollowedByDecimalUnitOrCurrency(fullText, index) {
    try {
        const after = fullText.slice(index);
        const match = /^[ \t\u00A0]*(₽|\$|€|%|руб\.?|коп\.?|тыс\.?|млн|млрд|трлн|квт|вт|dpi|lpi|км|кг|мм|см|мл|м|г\.?|л|шт\.?|сек\.?|мин\.?|мес\.?|с|кв\.?|куб\.?)(?=$|[^A-Za-zА-Яа-яЁё])/i.exec(after);
        return match !== null;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check decimal unit or currency", error);
        throw error;
    }
}
function normalizeSpacedYears(input) {
    try {
        return input
            .replace(/(\b\d{1,2}\.\d{2}\.)([12])[ \t\u00A0](\d{3})\b/g, "$1$2$3")
            .replace(/(^|[^\d])([12])[ \t\u00A0](\d{3})(?=[ \t\u00A0]*(?:г\.?|год|году|года)(?=$|[^A-Za-zА-Яа-яЁё]))/gi, "$1$2$3")
            .replace(/(©[ \t\u00A0]*)([12])[ \t\u00A0](\d{3})\b/g, "$1$2$3")
            .replace(/(\b[A-Za-z][A-Za-z\d._-]*\*[12])[ \t\u00A0](\d{3})\b/g, "$1$2");
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize spaced years", error);
        throw error;
    }
}
function shouldSkipNumberGrouping(fullText, start, end, integerPart) {
    try {
        if (isNumberPartOfCodeToken(fullText, start, end) || isNumberInsideDateLikeToken(fullText, start, end) || isNumberInsideFullDate(fullText, start, end) || isNumberPartOfMaskedSecret(fullText, start, integerPart) || isInsideProtectedNumericIdentifier(fullText, start, end) || isInsideRussianPhoneTail(fullText, start, end)) {
            return true;
        }
        const previous = previousNonSpaceSkippingDevelopmentMarker(fullText, start);
        if (previous === "№" || previous === "§" || isNumberAfterSignNumberPrefix(fullText, start)) {
            return true;
        }
        if (!/^\d{4}$/.test(integerPart)) {
            return false;
        }
        const year = Number(integerPart);
        if (year < 1000 || year > 2099) {
            return false;
        }
        const before = fullText.slice(Math.max(0, start - 16), start).toLowerCase();
        const after = fullText.slice(end, Math.min(fullText.length, end + 16)).toLowerCase();
        const hasYearWordAfter = /^[\s\u00A0*]*(г\.?|год|году|года)(?=$|[^A-Za-zА-Яа-яЁё])/.test(after);
        const hasCopyrightBefore = /(?:©|\(c\))[\s\u00A0*]*$/i.test(before);
        const hasMonthBefore = /(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)[\s\u00A0*]*$/i.test(before);
        const hasQuarterBefore = /квартал[\s\u00A0*]*$/i.test(before);
        const hasYearPrepositionBefore = /(?:^|[\s\u00A0*])(в|с)[\s\u00A0*]*$/.test(before);
        const hasRangeYearPrepositionBefore = /(?:^|[\s\u00A0*])по[\s\u00A0*]*$/.test(before) && !/^[\s\u00A0*]+[A-Za-zА-Яа-яЁё]/.test(after);
        const hasOpenEndedRangeAfter = /^[\s\u00A0*]*—[\s\u00A0*]*(?:н\.[\s\u00A0*]*в\.|наст\.[\s\u00A0*]*вр\.)(?=$|[^A-Za-zА-Яа-яЁё])/.test(after);
        return hasYearWordAfter || hasCopyrightBefore || hasMonthBefore || hasQuarterBefore || hasYearPrepositionBefore || hasRangeYearPrepositionBefore || hasOpenEndedRangeAfter;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check number grouping exception", error);
        throw error;
    }
}
function previousNonSpaceSkippingDevelopmentMarker(input, index) {
    try {
        for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
            if (/[ \t\u00A0]/.test(input[cursor]) || input[cursor] === DEVELOPMENT_NBSP_MARKER) {
                continue;
            }
            return input[cursor];
        }
        return null;
    }
    catch (error) {
        console.error("[Чистовик] Failed to find previous non-space char skipping development marker", error);
        throw error;
    }
}
function isNumberAfterSignNumberPrefix(input, index) {
    try {
        const previous = previousNonSpaceSkippingDevelopmentMarker(input, index);
        if (previous !== "+") {
            return false;
        }
        const plusIndex = findPreviousNonSpaceSkippingDevelopmentMarkerIndex(input, index);
        if (plusIndex === -1) {
            return false;
        }
        const beforePlus = previousNonSpaceSkippingDevelopmentMarker(input, plusIndex);
        return beforePlus === "№" || beforePlus === "§";
    }
    catch (error) {
        console.error("[Чистовик] Failed to check number after sign number prefix", error);
        throw error;
    }
}
function findPreviousNonSpaceSkippingDevelopmentMarkerIndex(input, index) {
    try {
        for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
            if (/[ \t\u00A0]/.test(input[cursor]) || input[cursor] === DEVELOPMENT_NBSP_MARKER) {
                continue;
            }
            return cursor;
        }
        return -1;
    }
    catch (error) {
        console.error("[Чистовик] Failed to find previous non-space index skipping development marker", error);
        throw error;
    }
}
function isNumberPartOfMaskedSecret(fullText, start, integerPart) {
    try {
        const before = fullText.slice(Math.max(0, start - 24), start);
        return (/^\d{4}$/.test(integerPart) && /[\*•]{2,}$/.test(before)) || /\*{2,}[\* \t\u00A0\-–—−]+$/.test(before);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check masked secret number", error);
        throw error;
    }
}
function isInsideProtectedNumericIdentifier(input, start, end) {
    try {
        const bounds = getNumericIdentifierTokenBounds(input, start, end);
        const token = input.slice(bounds.start, bounds.end);
        return isProtectedNumericIdentifierToken(token);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check protected numeric identifier", error);
        throw error;
    }
}
function getNumericIdentifierTokenBounds(input, start, end) {
    try {
        let tokenStart = start;
        let tokenEnd = end;
        while (tokenStart > 0 && /[\d \t\u00A0\-–—‑\*•]/.test(input[tokenStart - 1])) {
            tokenStart -= 1;
        }
        while (tokenEnd < input.length && /[\d \t\u00A0\-–—‑\*•]/.test(input[tokenEnd])) {
            tokenEnd += 1;
        }
        return { start: tokenStart, end: tokenEnd };
    }
    catch (error) {
        console.error("[Чистовик] Failed to get numeric identifier token bounds", error);
        throw error;
    }
}
function isProtectedNumericIdentifierToken(token) {
    try {
        return isPaymentCardNumberToken(token) || isPaymentAccountNumberToken(token) || isCardMaskToken(token);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check protected numeric identifier token", error);
        throw error;
    }
}
function isPaymentCardNumberToken(token) {
    try {
        const normalized = normalizeHorizontalSpaces(token);
        const digits = normalized.replace(/\D/g, "");
        if (digits.length < 16 || digits.length > 19) {
            return false;
        }
        return /^\d{16,19}$/.test(normalized) || /^\d{4}(?:[ \u00A0‑–—-]\d{4}){3}(?:[ \u00A0‑–—-]\d{1,3})?$/.test(normalized);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check payment card number token", error);
        throw error;
    }
}
function isPaymentAccountNumberToken(token) {
    try {
        const normalized = normalizeHorizontalSpaces(token);
        return /^\d{20}$/.test(normalized) || /^\d{4}(?:[ \u00A0‑–—-]\d{4}){4}$/.test(normalized);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check payment account number token", error);
        throw error;
    }
}
function isCardMaskToken(token) {
    try {
        return /^[\*•]{2,}\d{4}$/.test(normalizeHorizontalSpaces(token));
    }
    catch (error) {
        console.error("[Чистовик] Failed to check card mask token", error);
        throw error;
    }
}
function normalizeHorizontalSpaces(input) {
    try {
        return input.replace(/[\t\u00A0]/g, " ");
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize horizontal spaces", error);
        throw error;
    }
}
function isNumberInsideFullDate(fullText, start, end) {
    try {
        const before = fullText.slice(Math.max(0, start - 6), start);
        return /\d{1,2}\.\d{2}\.$/.test(before);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check full date number", error);
        throw error;
    }
}
function isNumberPartOfCodeToken(fullText, start, end) {
    var _a, _b;
    try {
        const previous = (_a = fullText[start - 1]) !== null && _a !== void 0 ? _a : "";
        if (isCodeTokenNeighbor(previous) || isCodeTokenNeighbor((_b = fullText[end]) !== null && _b !== void 0 ? _b : "")) {
            return true;
        }
        if (previous === DEVELOPMENT_NBSP_MARKER) {
            const previousSkippingMarker = previousNonSpaceSkippingDevelopmentMarker(fullText, start);
            return previousSkippingMarker !== null && /[A-Za-z]/.test(previousSkippingMarker);
        }
        return false;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check code token number", error);
        throw error;
    }
}
function isCodeTokenNeighbor(char) {
    try {
        return /^[A-Za-zА-Яа-яЁё]$/.test(char) || char === "-" || char === EN_DASH || char === EM_DASH || char === NB_HYPHEN;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check code token neighbor", error);
        throw error;
    }
}
function groupLongNumber(value) {
    try {
        return value.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
    }
    catch (error) {
        console.error("[Чистовик] Failed to group long number", error);
        throw error;
    }
}
function normalizeAbbreviations(input, ruleAnalyticsCollector = null) {
    try {
        let text = input;
        text = applyTypographyRule(ruleAnalyticsCollector, "abbr_month", text, (value) => value.replace(/([₽$€])[ \t\u00A0]*\/[ \t\u00A0]*мес\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (match, currency, offset, fullText) => {
            try {
                const periodIndex = match.lastIndexOf(".");
                if (periodIndex !== -1 && isSameLineSentenceContinuation(fullText, offset + periodIndex)) {
                    recordAbbreviationPeriodRuleObservation(ruleAnalyticsCollector, fullText, offset + periodIndex, true);
                    return `${currency}/мес.`;
                }
                if (periodIndex !== -1) {
                    recordAbbreviationPeriodRuleObservation(ruleAnalyticsCollector, fullText, offset + periodIndex, false);
                }
                return `${currency}/мес`;
            }
            catch (error) {
                console.error("[Чистовик] Failed to normalize currency per month", error);
                return match;
            }
        }));
        text = applyTypographyRule(ruleAnalyticsCollector, "abbr_compound", text, (value) => value
            .replace(/(^|[^A-Za-zА-Яа-яЁё])(и)[ \t\u00A0]+(т)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(д)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match, prefix, first, second, third) => `${prefix}${first}${NBSP}${second}.${NBSP}${third}.`)
            .replace(/(^|[^A-Za-zА-Яа-яЁё])(и)[ \t\u00A0]+(т)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(п)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match, prefix, first, second, third) => `${prefix}${first}${NBSP}${second}.${NBSP}${third}.`)
            .replace(/(^|[^A-Za-zА-Яа-яЁё])(и)[ \t\u00A0]+(др)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match, prefix, first, second) => `${prefix}${first}${NBSP}${second}.`)
            .replace(/(^|[^A-Za-zА-Яа-яЁё])(в)[ \t\u00A0]+(т)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(ч)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match, prefix, first, second, third) => `${prefix}${first}${NBSP}${second}.${NBSP}${third}.`)
            .replace(/(^|[^A-Za-zА-Яа-яЁё])(н)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(в)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match, prefix, first, second) => `${prefix}${first}.${NBSP}${second}.`)
            .replace(/(^|[^A-Za-zА-Яа-яЁё])(т)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(е)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match, prefix, first, second) => `${prefix}${first}.${NBSP}${second}.`)
            .replace(/(^|[^A-Za-zА-Яа-яЁё])(т)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(к)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match, prefix, first, second) => `${prefix}${first}.${NBSP}${second}.`)
            .replace(/(^|[^A-Za-zА-Яа-яЁё])(т)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(д)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match, prefix, first, second) => `${prefix}${first}.${NBSP}${second}.`)
            .replace(/(^|[^A-Za-zА-Яа-яЁё])(т)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(п)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match, prefix, first, second) => `${prefix}${first}.${NBSP}${second}.`)
            .replace(/(^|[^A-Za-zА-Яа-яЁё])p[ \t\u00A0]*\.?[ \t\u00A0]*p[ \t\u00A0]*\.?[ \t\u00A0]*s\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1P.${NBSP}P.${NBSP}S.`)
            .replace(/(^|[^A-Za-zА-Яа-яЁё])p[ \t\u00A0]*\.?[ \t\u00A0]*s\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1P.${NBSP}S.`));
        text = applyTypographyRule(ruleAnalyticsCollector, "abbr_area_volume", text, (value) => value
            .replace(/(^|[^A-Za-zА-Яа-яЁё])кв\.?[ \t\u00A0]*м\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1кв.${NBSP}м`)
            .replace(/(^|[^A-Za-zА-Яа-яЁё])куб\.?[ \t\u00A0]*м\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1куб.${NBSP}м`));
        text = applyTypographyRule(ruleAnalyticsCollector, "abbr_dotted", text, normalizeSlashSeparatedAbbreviationDots);
        text = applyTypographyRule(ruleAnalyticsCollector, "abbr_dotted", text, (value) => value.replace(new RegExp(`(^|[^${LETTERS}])(${DOTTED_ABBREVIATIONS})\\.?(?=$|[^${LETTERS}\\-${NB_HYPHEN}])`, "gi"), (match, prefix, abbreviation, offset, fullText) => {
            try {
                const abbreviationStart = offset + prefix.length;
                const abbreviationEnd = abbreviationStart + abbreviation.length;
                if (isSlashSeparatedAbbreviationPart(fullText, abbreviationStart, abbreviationEnd)) {
                    return match;
                }
                return `${prefix}${abbreviation}.`;
            }
            catch (error) {
                console.error("[Чистовик] Failed to normalize dotted abbreviation candidate", error);
                return match;
            }
        }));
        text = applyTypographyRule(ruleAnalyticsCollector, "abbr_dotted", text, (value) => value.replace(new RegExp(`(^|[^${LETTERS}])(под)(?=\\.|[ \\t\\u00A0]+\\d)(\\.?)`, "gi"), "$1$2."));
        text = applyTypographyRule(ruleAnalyticsCollector, "abbr_undotted_hyphenated", text, (value) => value.replace(new RegExp(`(^|[^${LETTERS}])(б[-${NB_HYPHEN}]р|пр[-${NB_HYPHEN}]т)\\.?(?=$|[^${LETTERS}])`, "gi"), "$1$2"));
        text = applyTypographyRule(ruleAnalyticsCollector, "abbr_month", text, (value) => value.replace(/(^|[^A-Za-zА-Яа-яЁё])мес\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (match, prefix, offset, fullText) => {
            try {
                const start = offset + prefix.length;
                const previous = previousNonSpace(fullText, start);
                const next = nextNonSpace(fullText, offset + match.length);
                const periodIndex = match.lastIndexOf(".");
                if (previous === "/" || previous === "₽" || previous === "$" || previous === "€" || next === "/") {
                    if (periodIndex !== -1 && isSameLineSentenceContinuation(fullText, offset + periodIndex)) {
                        recordAbbreviationPeriodRuleObservation(ruleAnalyticsCollector, fullText, offset + periodIndex, true);
                        return `${prefix}мес.`;
                    }
                    if (periodIndex !== -1) {
                        recordAbbreviationPeriodRuleObservation(ruleAnalyticsCollector, fullText, offset + periodIndex, false);
                    }
                    return `${prefix}мес`;
                }
                return `${prefix}мес.`;
            }
            catch (error) {
                console.error("[Чистовик] Failed to normalize мес", error);
                return match;
            }
        }));
        text = applyTypographyRule(ruleAnalyticsCollector, "abbr_undotted_large_number", text, (value) => value.replace(/(^|[^A-Za-zА-Яа-яЁё])(млн|млрд|трлн)\.(?=$|[^A-Za-zА-Яа-яЁё])/gi, (match, prefix, abbreviation, offset, fullText) => {
            try {
                const periodIndex = offset + match.length - 1;
                if (isSameLineSentenceContinuation(fullText, periodIndex)) {
                    recordAbbreviationPeriodRuleObservation(ruleAnalyticsCollector, fullText, periodIndex, true);
                    return `${prefix}${abbreviation}.`;
                }
                recordAbbreviationPeriodRuleObservation(ruleAnalyticsCollector, fullText, periodIndex, false);
                return `${prefix}${abbreviation}`;
            }
            catch (error) {
                console.error("[Чистовик] Failed to normalize large number abbreviation period", error);
                return match;
            }
        }));
        text = applyTypographyRule(ruleAnalyticsCollector, "abbr_undotted_units", text, (value) => value.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?[ \t\u00A0]+)(квт|вт|в|dpi|lpi|км|кг|м|с|мм|см|л|мл)\.(?=$|[^A-Za-zА-Яа-яЁё])/gi, (match, numberWithSpace, unit, offset, fullText) => {
            try {
                const periodIndex = offset + match.length - 1;
                const normalizedUnit = getCanonicalTechnicalMeasurementUnit(unit);
                if (isSameLineSentenceContinuation(fullText, periodIndex)) {
                    recordAbbreviationPeriodRuleObservation(ruleAnalyticsCollector, fullText, periodIndex, true);
                    return `${numberWithSpace}${normalizedUnit}.`;
                }
                recordAbbreviationPeriodRuleObservation(ruleAnalyticsCollector, fullText, periodIndex, false);
                return `${numberWithSpace}${normalizedUnit}`;
            }
            catch (error) {
                console.error("[Чистовик] Failed to normalize unit period", error);
                return match;
            }
        }));
        return text;
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize abbreviations", error);
        throw error;
    }
}
function recordAbbreviationPeriodRuleObservation(collector, fullText, periodIndex, preservedAsSentenceEnd) {
    try {
        if (preservedAsSentenceEnd) {
            recordTypographyRuleObservation(collector, "abbr_sentence_end");
            return;
        }
        if (/^[ \t\u00A0]*[\r\n]/.test(fullText.slice(periodIndex + 1))) {
            recordTypographyRuleDerivedChange(collector, "abbr_line_break");
        }
    }
    catch (_a) {
        // Rule analytics must never affect typography.
    }
}
function isSentenceEndingPeriod(fullText, periodIndex) {
    try {
        const after = fullText.slice(periodIndex + 1);
        return after.length === 0 || /^[ \t\u00A0]*$/.test(after) || /^[ \t\u00A0]+[A-ZА-ЯЁ]/.test(after);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check sentence-ending period", error);
        throw error;
    }
}
function isSameLineSentenceContinuation(fullText, periodIndex) {
    try {
        const after = fullText.slice(periodIndex + 1);
        return /^[ \t\u00A0]+[A-ZА-ЯЁ]/.test(after);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check same-line sentence continuation", error);
        throw error;
    }
}
function normalizeSlashSeparatedAbbreviationDots(input) {
    try {
        return input
            .replace(new RegExp(`(^|[^${LETTERS}])([А-Яа-яЁё]{1,4})\\.(?=[ \\t\\u00A0]*\\/[ \\t\\u00A0]*[А-Яа-яЁё])`, "g"), (match, prefix, abbreviation, offset, fullText) => {
            try {
                if (abbreviation.length === 1 && isPersonInitialBeforeSlash(fullText, offset + prefix.length)) {
                    return match;
                }
                return `${prefix}${abbreviation}`;
            }
            catch (error) {
                console.error("[Чистовик] Failed to normalize abbreviation dot before slash", error);
                return match;
            }
        })
            .replace(new RegExp(`(^|[^${LETTERS}])((?:[А-Яа-яЁё]{1,4}[ \\t\\u00A0]*\\/[ \\t\\u00A0]*)+[А-Яа-яЁё]{1,4})\\.(?=[ \\t\\u00A0]+[а-яё])`, "g"), (match, prefix, slashAbbreviation, offset, fullText) => {
            try {
                const dotIndex = offset + match.length - 1;
                if (isSlashSeparatedAreaUnitAbbreviation(fullText, slashAbbreviation, dotIndex)) {
                    return match;
                }
                return `${prefix}${slashAbbreviation}`;
            }
            catch (error) {
                console.error("[Чистовик] Failed to normalize slash-separated abbreviation dot candidate", error);
                return match;
            }
        });
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize slash-separated abbreviation dots", error);
        throw error;
    }
}
function isPersonInitialBeforeSlash(fullText, initialIndex) {
    try {
        return new RegExp(`[А-ЯЁ][а-яё]+[ \\t\\u00A0]+$`).test(fullText.slice(0, initialIndex));
    }
    catch (error) {
        console.error("[Чистовик] Failed to check person initial before slash", error);
        throw error;
    }
}
function isSlashSeparatedAreaUnitAbbreviation(fullText, slashAbbreviation, dotIndex) {
    try {
        return /\/[ \t\u00A0]*(кв|куб)$/i.test(slashAbbreviation) &&
            /^[ \t\u00A0]+м(?=$|[^A-Za-zА-Яа-яЁё])/.test(fullText.slice(dotIndex + 1));
    }
    catch (error) {
        console.error("[Чистовик] Failed to check slash-separated area unit abbreviation", error);
        throw error;
    }
}
function isSlashSeparatedAbbreviationPart(fullText, abbreviationStart, abbreviationEnd) {
    try {
        const previousIndex = findPreviousHorizontalNonSpaceIndex(fullText, abbreviationStart);
        if (previousIndex !== -1 && fullText[previousIndex] === "/") {
            const beforeSlashIndex = findPreviousHorizontalNonSpaceIndex(fullText, previousIndex);
            if (beforeSlashIndex !== -1 && isLetter(fullText[beforeSlashIndex])) {
                return true;
            }
        }
        const nextIndex = findNextHorizontalNonSpaceIndex(fullText, abbreviationEnd);
        if (nextIndex !== -1 && fullText[nextIndex] === "/") {
            const afterSlashIndex = findNextHorizontalNonSpaceIndex(fullText, nextIndex + 1);
            if (afterSlashIndex !== -1 && isLetter(fullText[afterSlashIndex])) {
                return true;
            }
        }
        return false;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check slash-separated abbreviation part", error);
        throw error;
    }
}
function findPreviousHorizontalNonSpaceIndex(input, index) {
    try {
        for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
            if (/[ \t\u00A0]/.test(input[cursor])) {
                continue;
            }
            return cursor;
        }
        return -1;
    }
    catch (error) {
        console.error("[Чистовик] Failed to find previous horizontal non-space index", error);
        throw error;
    }
}
function findNextHorizontalNonSpaceIndex(input, index) {
    try {
        for (let cursor = index; cursor < input.length; cursor += 1) {
            if (/[ \t\u00A0]/.test(input[cursor])) {
                continue;
            }
            return cursor;
        }
        return -1;
    }
    catch (error) {
        console.error("[Чистовик] Failed to find next horizontal non-space index", error);
        throw error;
    }
}
function applyNonBreakingSpaces(input, ruleAnalyticsCollector = null) {
    try {
        let text = input;
        const beforeDash = text;
        text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_before_dash", text, (value) => value.replace(/[ \t\u00A0]+—/g, `${NBSP}${EM_DASH}`));
        if (text !== beforeDash) {
            recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "dash_nbsp_before");
        }
        text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_particles", text, applyParticleNonBreakingSpaces);
        text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_short_cyrillic_words", text, applyShortWordNonBreakingSpaces);
        text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_initials", text, (value) => value
            .replace(/(^|[^А-ЯЁа-яё])([А-ЯЁ])\.[ \t\u00A0]*([А-ЯЁ])\.[ \t\u00A0]*(?=[А-ЯЁ][а-яё]+)/g, `$1$2.${NBSP}$3.${NBSP}`)
            .replace(/(^|[^А-ЯЁа-яё])([А-ЯЁ])\.[ \t\u00A0]*(?=[А-ЯЁ][а-яё]+)/g, `$1$2.${NBSP}`));
        text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_after_number_sign", text, (value) => value.replace(/([№§])[ \t\u00A0]*(?=\d)/g, `$1${NBSP}`));
        text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_copyright_year", text, (value) => value.replace(/(©)[ \t\u00A0]*(?=[12]\d{3}\b)/g, `$1${NBSP}`));
        text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_number_unit", text, (value) => value.replace(/(^|[^A-Za-zА-Яа-яЁё])(д|г|стр|кв)\.[ \t\u00A0]*(?=\d)/gi, `$1$2.${NBSP}`));
        text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_percent_metric", text, applyWhitelistedPercentNonBreakingSpaces);
        text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_number_unit", text, (value) => value.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?)[ \t]+([A-Za-zА-Яа-яЁё]+\.?)/g, (match, number, followingWord, offset, fullText) => {
            try {
                const numberStart = offset;
                const numberEnd = numberStart + number.length;
                if (!shouldKeepNumberWithNextWord(fullText, numberStart, numberEnd, number)) {
                    return match;
                }
                const replacement = `${number}${NBSP}${followingWord}`;
                if (replacement !== match && /^(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)$/i.test(followingWord.replace(/\.$/, ""))) {
                    recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "nbsp_calendar_date");
                }
                return replacement;
            }
            catch (error) {
                console.error("[Чистовик] Failed to apply number non-breaking space", error);
                return match;
            }
        }));
        text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_number_unit", text, restoreSpacesAfterMeasurementUnits);
        return text;
    }
    catch (error) {
        console.error("[Чистовик] Failed to apply non-breaking spaces", error);
        throw error;
    }
}
function applyWhitelistedPercentNonBreakingSpaces(input) {
    try {
        const percentValue = "\\d+(?:[.,]\\d+)?(?:—\\d+(?:[.,]\\d+)?)?%";
        const percentWordPattern = new RegExp(`(^|[^${LETTERS}\\d\\-${NB_HYPHEN}])(${PERCENT_WORD_WHITELIST_PATTERN})[ \\t\\u00A0]+(${percentValue})`, "gi");
        return input.replace(percentWordPattern, `$1$2${NBSP}$3`);
    }
    catch (error) {
        console.error("[Чистовик] Failed to apply whitelist percent non-breaking spaces", error);
        throw error;
    }
}
function shouldKeepNumberWithNextWord(fullText, start, end, number) {
    try {
        const followingText = fullText.slice(end, Math.min(fullText.length, end + 24));
        if (isRangeEndBeforeMonth(fullText, start, followingText)) {
            return true;
        }
        if (isNumberPartOfDate(fullText, start, end) || isInsideProtectedToken(fullText, start, end)) {
            return false;
        }
        const previous = previousNonSpaceSkippingDevelopmentMarker(fullText, start);
        if (previous === "№" || previous === "§" || isNumberAfterSignNumberPrefix(fullText, start) || hasPreviousNumberBindingAbbreviation(fullText, start)) {
            return false;
        }
        const integerPart = number.split(",")[0].replace(/[ \t\u00A0]/g, "");
        return !shouldSkipNumberGrouping(fullText, start, end, integerPart);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check number follower", error);
        throw error;
    }
}
function isRangeEndBeforeMonth(fullText, start, followingText) {
    try {
        const previous = previousNonSpaceSkippingDevelopmentMarker(fullText, start);
        if (previous !== EM_DASH) {
            return false;
        }
        return /^[ \t\u00A0]+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?=$|[^A-Za-zА-Яа-яЁё])/i.test(followingText);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check range end before month", error);
        throw error;
    }
}
function hasPreviousNumberBindingAbbreviation(fullText, index) {
    try {
        const before = fullText.slice(Math.max(0, index - 16), index);
        return /(?:^|[^A-Za-zА-Яа-яЁё])(д|г|стр|кв)\.[ \t\u00A0]*$/i.test(before);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check number-binding abbreviation", error);
        throw error;
    }
}
function applyParticleNonBreakingSpaces(input) {
    try {
        const particlePattern = new RegExp(`(^|\\S)[ \\t]+(ли|же|бы|ль|ж|б)(?=$|[^${LETTERS}\\-${NB_HYPHEN}])`, "gi");
        return input.replace(particlePattern, `$1${NBSP}$2`);
    }
    catch (error) {
        console.error("[Чистовик] Failed to apply particle non-breaking spaces", error);
        throw error;
    }
}
function applyShortWordNonBreakingSpaces(input) {
    try {
        const shortWordPattern = new RegExp(`(^|[^${LETTERS}\\d\\-${NB_HYPHEN}])(?!(?:ли|же|бы|ль|ж|б)[ \\t]+)([А-Яа-яЁё]{1,2})[ \\t]+(?=\\S)`, "gi");
        let text = input;
        let previous = "";
        while (text !== previous) {
            previous = text;
            shortWordPattern.lastIndex = 0;
            text = text.replace(shortWordPattern, `$1$2${NBSP}`);
        }
        return restoreSpacesAfterMeasurementUnits(text);
    }
    catch (error) {
        console.error("[Чистовик] Failed to apply short word non-breaking spaces", error);
        throw error;
    }
}
function restoreSpacesAfterMeasurementUnits(input) {
    try {
        return input.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?\u00A0(?:кВт|Вт|В|г|кг|м|км|мм|см|л|мл|с|dpi|lpi))\u00A0(?=[A-Za-zА-Яа-яЁё])/gi, "$1 ");
    }
    catch (error) {
        console.error("[Чистовик] Failed to restore spaces after measurement units", error);
        throw error;
    }
}
function normalizeMathAndSymbols(input, ruleAnalyticsCollector = null) {
    try {
        let text = applyTypographyRule(ruleAnalyticsCollector, "math_fractions", input, (value) => value
            .replace(/(^|[^A-Za-zА-Яа-яЁё\d])1\/2($|[^A-Za-zА-Яа-яЁё\d])/g, "$1½$2")
            .replace(/(^|[^A-Za-zА-Яа-яЁё\d])1\/4($|[^A-Za-zА-Яа-яЁё\d])/g, "$1¼$2")
            .replace(/(^|[^A-Za-zА-Яа-яЁё\d])3\/4($|[^A-Za-zА-Яа-яЁё\d])/g, "$1¾$2"));
        text = applyTypographyRule(ruleAnalyticsCollector, "math_subtraction_context", text, (value) => value.replace(/(\d+(?:,\d+)?%)[ \t\u00A0]+[-–−][ \t\u00A0]+(\d+(?:,\d+)?%)/g, `$1${NBSP}${MINUS}${NBSP}$2`));
        text = applyTypographyRule(ruleAnalyticsCollector, "math_expression_spacing", text, (value) => normalizeMathExpressions(value, ruleAnalyticsCollector));
        text = applyTypographyRule(ruleAnalyticsCollector, "math_negative_number", text, (value) => value.replace(/(^|[^A-Za-zА-Яа-яЁё\d])([-–−])[ \t\u00A0]*(\d)/g, (match, prefix, _sign, digit, offset, fullText) => {
            try {
                const signIndex = offset + prefix.length;
                const previous = previousNonSpace(fullText, signIndex);
                if (previous !== null && /\d/.test(previous)) {
                    return match;
                }
                if (isWordDateRangeDashCandidate(fullText, signIndex)) {
                    return match;
                }
                if (isMaskedSecretSign(fullText, signIndex)) {
                    return match;
                }
                return `${prefix}${MINUS}${digit}`;
            }
            catch (error) {
                console.error("[Чистовик] Failed to normalize negative number", error);
                return match;
            }
        }));
        text = applyTypographyRule(ruleAnalyticsCollector, "math_subtraction_context", text, (value) => value.replace(/(\d+(?:,\d+)?%)[ \t\u00A0]+−(\d+(?:,\d+)?%)/g, `$1${NBSP}${MINUS}${NBSP}$2`));
        text = applyTypographyRule(ruleAnalyticsCollector, "temperature_scale", text, (value) => value.replace(/(\d(?:[\d \u00A0]*\d)?)[ \t\u00A0]*°?[ \t\u00A0]*([CFС])\b/g, (_match, number, unit) => `${number}${NBSP}°${unit === "F" ? "F" : "C"}`));
        text = applyTypographyRule(ruleAnalyticsCollector, "temperature_degree_only", text, (value) => value.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?)[ \t\u00A0]+°(?![CFС]\b)/g, "$1°"));
        text = applyTypographyRule(ruleAnalyticsCollector, "symbol_legal_marks", text, (value) => value.replace(/\(c\)/gi, "©").replace(/\(tm\)/gi, "™").replace(/\(r\)/gi, "®"));
        return applyTypographyRule(ruleAnalyticsCollector, "symbol_arrow", text, (value) => value.replace(/(?:->|=>)/g, "→"));
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize math and symbols", error);
        throw error;
    }
}
function isWordDateRangeDashCandidate(fullText, dashIndex) {
    try {
        const month = "января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря";
        const before = fullText.slice(Math.max(0, dashIndex - 32), dashIndex);
        const after = fullText.slice(dashIndex + 1, dashIndex + 33);
        const beforePattern = new RegExp(`\\d{1,2}[ \\t\\u00A0]+(?:${month})[ \\t\\u00A0]*$`, "i");
        const afterPattern = new RegExp(`^[ \\t\\u00A0]*\\d{1,2}[ \\t\\u00A0]+(?:${month})(?=$|[^${LETTERS}])`, "i");
        return beforePattern.test(before) && afterPattern.test(after);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check word date range dash candidate", error);
        throw error;
    }
}
function isMaskedSecretSign(fullText, signIndex) {
    try {
        const before = fullText.slice(Math.max(0, signIndex - 24), signIndex);
        return /(?:^|[\s\u00A0:])\*{2,}[\* \t\u00A0]*$/.test(before);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check masked secret sign", error);
        throw error;
    }
}
function normalizeMathExpressions(input, ruleAnalyticsCollector = null) {
    try {
        let result = "";
        let index = 0;
        while (index < input.length) {
            const expression = parseMathExpression(input, index, ruleAnalyticsCollector);
            if (expression === null) {
                result += input[index];
                index += 1;
                continue;
            }
            result += expression.text;
            index = expression.end;
        }
        return result;
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize math expressions", error);
        throw error;
    }
}
function parseMathExpression(input, start, ruleAnalyticsCollector = null) {
    try {
        const firstNumber = parseMathNumber(input, start, true);
        if (firstNumber === null || !hasMathNumberBoundaryBefore(input, start) || isInsideProtectedToken(input, start, firstNumber.end)) {
            return null;
        }
        const parts = [firstNumber.text];
        const operators = [];
        let cursor = firstNumber.end;
        while (cursor < input.length) {
            const operator = parseMathOperator(input, cursor);
            if (operator === null) {
                break;
            }
            const nextNumber = parseMathNumber(input, operator.end, true);
            if (nextNumber === null) {
                break;
            }
            parts.push(`${NBSP}${operator.text}${NBSP}`, nextNumber.text);
            operators.push(operator);
            cursor = nextNumber.end;
        }
        if (operators.length === 0 || !hasMathNumberBoundaryAfter(input, cursor) || isInsideProtectedToken(input, start, cursor)) {
            return null;
        }
        if (!hasMathExpressionContext(firstNumber, operators)) {
            return null;
        }
        const normalizedText = parts.join("");
        if (normalizedText !== input.slice(start, cursor)) {
            for (const operator of operators) {
                if (operator.text === "×") {
                    recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "math_multiplication");
                }
                else if (operator.text === MINUS) {
                    recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "math_subtraction_context");
                }
                else {
                    recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "math_basic_operators");
                }
            }
        }
        return {
            end: cursor,
            text: normalizedText,
        };
    }
    catch (error) {
        console.error("[Чистовик] Failed to parse math expression", error);
        throw error;
    }
}
function parseMathNumber(input, start, allowSign) {
    var _a, _b, _c, _d;
    try {
        let cursor = start;
        let sign = "";
        if (allowSign && isMinusLike((_a = input[cursor]) !== null && _a !== void 0 ? _a : "")) {
            sign = MINUS;
            cursor += 1;
            while (/[ \t\u00A0]/.test((_b = input[cursor]) !== null && _b !== void 0 ? _b : "")) {
                cursor += 1;
            }
        }
        const numberStart = cursor;
        if (!/\d/.test((_c = input[cursor]) !== null && _c !== void 0 ? _c : "")) {
            return null;
        }
        cursor += 1;
        while (cursor < input.length) {
            const char = input[cursor];
            const next = (_d = input[cursor + 1]) !== null && _d !== void 0 ? _d : "";
            if (/\d/.test(char) || (char === "," && /\d/.test(next))) {
                cursor += 1;
                continue;
            }
            if ((char === " " || char === NBSP) && /\d/.test(next)) {
                cursor += 1;
                continue;
            }
            break;
        }
        if (input[cursor] === "%") {
            cursor += 1;
        }
        return {
            end: cursor,
            hasUnaryMinus: sign !== "",
            text: `${sign}${input.slice(numberStart, cursor).replace(/ /g, NBSP)}`,
        };
    }
    catch (error) {
        console.error("[Чистовик] Failed to parse math number", error);
        throw error;
    }
}
function parseMathOperator(input, start) {
    var _a, _b, _c, _d;
    try {
        let cursor = start;
        while (/[ \t\u00A0]/.test((_a = input[cursor]) !== null && _a !== void 0 ? _a : "")) {
            cursor += 1;
        }
        const char = (_b = input[cursor]) !== null && _b !== void 0 ? _b : "";
        if (!isMathOperatorChar(char)) {
            return null;
        }
        if (char === "-" && input[cursor + 1] === ">") {
            return null;
        }
        if (isMinusLike(char) && input[cursor - 1] === "%" && /\d/.test((_c = input[cursor + 1]) !== null && _c !== void 0 ? _c : "")) {
            return null;
        }
        cursor += 1;
        while (/[ \t\u00A0]/.test((_d = input[cursor]) !== null && _d !== void 0 ? _d : "")) {
            cursor += 1;
        }
        return {
            end: cursor,
            text: normalizeMathOperator(char),
        };
    }
    catch (error) {
        console.error("[Чистовик] Failed to parse math operator", error);
        throw error;
    }
}
function isMathOperatorChar(char) {
    try {
        return char === "+" || char === "=" || char === "/" || char === "÷" || char === "*" || char === "×" || char === "x" || char === "X" || char === "х" || char === "Х" || isMinusLike(char);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check math operator char", error);
        throw error;
    }
}
function normalizeMathOperator(char) {
    try {
        if (char === "*" || char === "x" || char === "X" || char === "х" || char === "Х") {
            return "×";
        }
        if (isMinusLike(char)) {
            return MINUS;
        }
        return char;
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize math operator", error);
        throw error;
    }
}
function isMinusLike(char) {
    try {
        return char === "-" || char === EN_DASH || char === EM_DASH || char === MINUS;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check minus-like char", error);
        throw error;
    }
}
function hasMathExpressionContext(firstNumber, operators) {
    try {
        if (firstNumber.hasUnaryMinus || firstNumber.text.endsWith("%") || operators.length > 1) {
            return true;
        }
        return operators.some((operator) => operator.text !== MINUS);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check math expression context", error);
        throw error;
    }
}
function hasMathNumberBoundaryBefore(input, start) {
    var _a;
    try {
        const previous = (_a = input[start - 1]) !== null && _a !== void 0 ? _a : "";
        return !/[A-Za-zА-Яа-яЁё\d.,]/.test(previous);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check math number boundary before", error);
        throw error;
    }
}
function hasMathNumberBoundaryAfter(input, end) {
    var _a, _b, _c;
    try {
        const next = (_a = input[end]) !== null && _a !== void 0 ? _a : "";
        if (next === "." && !/\d/.test((_b = input[end + 1]) !== null && _b !== void 0 ? _b : "")) {
            return true;
        }
        if (next === "," && !/\d/.test((_c = input[end + 1]) !== null && _c !== void 0 ? _c : "")) {
            return true;
        }
        return !/[A-Za-zА-Яа-яЁё\d.,]/.test(next);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check math number boundary after", error);
        throw error;
    }
}
function isInsideProtectedToken(input, start, end) {
    try {
        if (isInsidePhoneNumberCandidate(input, start, end) || isInsideProtectedNumericIdentifier(input, start, end)) {
            return true;
        }
        const bounds = getLooseTokenBounds(input, start, end);
        const token = input.slice(bounds.start, bounds.end);
        if (isMaskedSecretToken(token)) {
            return true;
        }
        if (/^[A-Za-z][A-Za-z\d+.-]*:\/\//.test(token) || /^www\./i.test(token) || token.includes("@")) {
            return true;
        }
        if (/^\d{1,4}[-–—]\d{1,2}[-–—]\d{1,4}$/.test(token)) {
            return true;
        }
        if (token.includes("_") || hasProtectedTokenLetters(token)) {
            return true;
        }
        if (/^[A-Za-zА-Яа-яЁё]+[\w.-]*[-–—]\d/.test(token) || /\d[-–—][\w.-]*[A-Za-zА-Яа-яЁё]/.test(token)) {
            return true;
        }
        return false;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check protected token", error);
        throw error;
    }
}
function isMaskedSecretToken(token) {
    try {
        return /\*{2,}/.test(token) && /\d/.test(token);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check masked secret token", error);
        throw error;
    }
}
function hasProtectedTokenLetters(token) {
    try {
        for (const char of token) {
            if (isLetter(char) && char !== "x" && char !== "X" && char !== "х" && char !== "Х") {
                return true;
            }
        }
        return false;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check protected token letters", error);
        throw error;
    }
}
function isInsidePhoneNumberCandidate(input, start, end) {
    try {
        const bounds = getPhoneLikeTokenBounds(input, start, end);
        const token = input.slice(bounds.start, bounds.end);
        return isRussianFullPhoneToken(token) || isRussianPhoneTailToken(token);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check phone number candidate", error);
        throw error;
    }
}
function isInsideRussianPhoneTail(input, start, end) {
    try {
        const bounds = getPhoneLikeTokenBounds(input, start, end);
        const token = input.slice(bounds.start, bounds.end);
        return isRussianPhoneTailToken(token);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check Russian phone tail", error);
        throw error;
    }
}
function isRussianFullPhoneToken(token) {
    try {
        const digits = token.replace(/\D/g, "");
        return digits.length === 11 && (digits[0] === "7" || digits[0] === "8");
    }
    catch (error) {
        console.error("[Чистовик] Failed to check Russian full phone token", error);
        throw error;
    }
}
function isRussianPhoneTailToken(token) {
    try {
        const normalized = normalizeHorizontalSpaces(token);
        const digits = normalized.replace(/\D/g, "");
        return digits.length === 10 && digits[0] === "9" && /^[ ]*9\d{2}[ .\-–—‑]*\d{3}[ .\-–—‑]*\d{2}[ .\-–—‑]*\d{2}[ ]*$/.test(normalized);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check Russian phone tail token", error);
        throw error;
    }
}
function isStandaloneRussianPhoneCountryPrefix(input) {
    try {
        return /^[ \t\u00A0]*\+[ \t\u00A0]*7[ \t\u00A0]*$/.test(input);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check standalone phone country prefix", error);
        throw error;
    }
}
function normalizeStandaloneRussianPhoneCountryPrefix(input) {
    try {
        return input.replace(/^[ \t\u00A0]*\+[ \t\u00A0]*7[ \t\u00A0]*$/, "+7");
    }
    catch (error) {
        console.error("[Чистовик] Failed to normalize standalone phone country prefix", error);
        throw error;
    }
}
function getPhoneLikeTokenBounds(input, start, end) {
    try {
        let tokenStart = start;
        let tokenEnd = end;
        while (tokenStart > 0 && /[\d+()[\] \t\u00A0.\-–—‑*]/.test(input[tokenStart - 1])) {
            tokenStart -= 1;
        }
        while (tokenEnd < input.length && /[\d+()[\] \t\u00A0.\-–—‑*]/.test(input[tokenEnd])) {
            tokenEnd += 1;
        }
        return { start: tokenStart, end: tokenEnd };
    }
    catch (error) {
        console.error("[Чистовик] Failed to get phone-like token bounds", error);
        throw error;
    }
}
function getLooseTokenBounds(input, start, end) {
    try {
        let tokenStart = start;
        let tokenEnd = end;
        while (tokenStart > 0 && !/[ \t\u00A0\n\r()[\]{}<>«»"']/.test(input[tokenStart - 1])) {
            tokenStart -= 1;
        }
        while (tokenEnd < input.length && !/[ \t\u00A0\n\r()[\]{}<>«»"']/.test(input[tokenEnd])) {
            tokenEnd += 1;
        }
        return { start: tokenStart, end: tokenEnd };
    }
    catch (error) {
        console.error("[Чистовик] Failed to get loose token bounds", error);
        throw error;
    }
}
function previousVisibleChar(input, index) {
    try {
        for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
            if (!/[ \t\u00A0]/.test(input[cursor])) {
                return input[cursor];
            }
        }
        return null;
    }
    catch (error) {
        console.error("[Чистовик] Failed to find previous visible char", error);
        throw error;
    }
}
function nextVisibleChar(input, index) {
    try {
        for (let cursor = index + 1; cursor < input.length; cursor += 1) {
            if (!/[ \t\u00A0]/.test(input[cursor])) {
                return input[cursor];
            }
        }
        return null;
    }
    catch (error) {
        console.error("[Чистовик] Failed to find next visible char", error);
        throw error;
    }
}
function previousNonSpace(input, index) {
    try {
        for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
            if (!/[ \t\u00A0]/.test(input[cursor])) {
                return input[cursor];
            }
        }
        return null;
    }
    catch (error) {
        console.error("[Чистовик] Failed to find previous non-space char", error);
        throw error;
    }
}
function nextNonSpace(input, index) {
    try {
        for (let cursor = index; cursor < input.length; cursor += 1) {
            if (!/[ \t\u00A0]/.test(input[cursor])) {
                return input[cursor];
            }
        }
        return null;
    }
    catch (error) {
        console.error("[Чистовик] Failed to find next non-space char", error);
        throw error;
    }
}
function countMatches(input, regex) {
    var _a, _b;
    try {
        return (_b = (_a = input.match(regex)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
    }
    catch (error) {
        console.error("[Чистовик] Failed to count regex matches", error);
        throw error;
    }
}
function isLetter(char) {
    try {
        return /^[A-Za-zА-Яа-яЁё]$/.test(char);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check letter", error);
        throw error;
    }
}
function isCyrillicLetter(char) {
    try {
        return /^[А-Яа-яЁё]$/.test(char);
    }
    catch (error) {
        console.error("[Чистовик] Failed to check Cyrillic letter", error);
        throw error;
    }
}
function isDash(char) {
    try {
        return char === "-" || char === EN_DASH || char === EM_DASH || char === MINUS;
    }
    catch (error) {
        console.error("[Чистовик] Failed to check dash", error);
        throw error;
    }
}
void run();
