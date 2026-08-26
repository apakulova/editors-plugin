const NBSP = "\u00A0";
const DEVELOPMENT_NBSP_MARKER = "*";
const DEVELOPMENT_NBSP_FILL: SolidPaint = {
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
const ANALYTICS_API_HOST = "https://chistovik-plugin.vercel.app";
const ANALYTICS_CAPTURE_PATH = "/api/capture";
const NUMBER_DIAGNOSTICS_CAPTURE_PATH = "/api/number-diagnostics";
const NUMBER_DIAGNOSTICS_SCHEMA_VERSION = 3;
const NUMBER_DIAGNOSTICS_END_AT_MS = Date.parse("2026-09-19T00:00:00+03:00");
const NUMBER_DIAGNOSTICS_QUEUE_KEY = "numberDiagnosticsQueue";
const NUMBER_DIAGNOSTICS_MAX_QUEUED_REPORTS = 10;
const NUMBER_DIAGNOSTICS_MAX_CASES_PER_PAYLOAD = 50;
const NUMBER_DIAGNOSTICS_MAX_PAYLOAD_BYTES = 440 * 1024;
const NUMBER_DIAGNOSTICS_MAX_TEXT_LENGTH = 12_000;
const NUMBER_RULES_VERSION = "numbers-2026-08-25-v1";
const ANALYTICS_SCHEMA_VERSION = 14;
const ANALYTICS_PLUGIN_RELEASE = "2026-08-26";
const PERFORMANCE_MEASUREMENT_VERSION = 8;
const POINT_EDITING_RUNTIME_PHASE = "point_safe";
const DEFAULT_TEXT_WRITE_STRATEGY: TextWriteStrategy = "point";
const RULE_ANALYTICS_VERSION = 3;
const ANALYTICS_ANONYMOUS_ID_KEY = "analyticsAnonymousId";
const ANALYTICS_EVENT_QUEUE_KEY = "analyticsEventQueue";
const ANALYTICS_CLOSE_GRACE_PERIOD_MS = 500;
const ANALYTICS_MAX_QUEUED_EVENTS = 100;
const FINAL_NOTIFICATION_CLOSE_FALLBACK_MS = 6000;
const FINAL_NOTIFICATION_TIMEOUT_MS = 4000;
const FIGMA_OPERATION_TIMEOUT_MS = 15000;
const FONT_LOADING_RUN_TIMEOUT_MS = 15000;
const TEXT_LAYER_ROLLBACK_TIMEOUT_MS = 15000;
const PROBLEM_LAYER_TEXT_PREVIEW_MAX_LENGTH = 320;
const TEXT_LAYER_PREPARATION_MAX_ATTEMPTS = 3;
const TEXT_LAYER_CONTENT_CHANGED_ERROR_NAME = "TextLayerContentChangedError";
const LETTERS = "A-Za-zА-Яа-яЁё";
let unicodeMarkPattern: RegExp | null | undefined;
let problemLayerSelectionRequestId = 0;
const PERCENT_WORD_WHITELIST_PATTERN = "скидк(?:а|и|е|у|ой|ою)|кэшбэк(?:а|у|ом|е)?|кешбэк(?:а|у|ом|е)?|ставк(?:а|и|е|у|ой)|комисси(?:я|и|ю|ей)|доходност(?:ь|и|ью)|рассрочк(?:а|и|е|у|ой)|налог(?:а|у|ом|е)?|ндс";
const DOTTED_ABBREVIATIONS = "тыс|мин|д|кв|г|гл|илл|ст|п|см|им|обл|кр|пос|пер|пр|просп|пл|бул|наб|ш|туп|оф|комн|мкр|уч|вл|влад|корп|эт|пгт|рис|стр|руб|коп";
const QUANTITY_CURRENCY_SYMBOLS = "₽$€£¥₸₾₴₺֏₪₹₩₫฿₱";
const QUANTITY_SCALE_PATTERN = "тыс\\.?|млн|млрд|трлн|тысяча|тысячи|тысяч|миллион|миллиона|миллионов|миллиард|миллиарда|миллиардов|триллион|триллиона|триллионов|квадриллион|квадриллиона|квадриллионов|квинтиллион|квинтиллиона|квинтиллионов|секстиллион|секстиллиона|секстиллионов|септиллион|септиллиона|септиллионов|октиллион|октиллиона|октиллионов|нониллион|нониллиона|нониллионов|дециллион|дециллиона|дециллионов";
const QUANTITY_HORIZONTAL_SPACE_PATTERN = "[ \\t\\u00A0\\u2009\\u202F]";
const QUANTITY_NUMBER_TOKEN_PATTERN = "[+−-]?\\d+(?:[ \\t\\u00A0\\u2009\\u202F]\\d{3})*(?:,\\d+)?";
const LEADING_CURRENCY_VALUE_PATTERN = new RegExp(
  `(^|[^${LETTERS}\\d${QUANTITY_CURRENCY_SYMBOLS}])([${QUANTITY_CURRENCY_SYMBOLS}])${QUANTITY_HORIZONTAL_SPACE_PATTERN}*((?:\\+7|8)${QUANTITY_HORIZONTAL_SPACE_PATTERN}+\\d{3}${QUANTITY_HORIZONTAL_SPACE_PATTERN}+\\d{3}${NB_HYPHEN}\\d{2}${NB_HYPHEN}\\d{2}|(?:[+${MINUS}-]${QUANTITY_HORIZONTAL_SPACE_PATTERN}*)?\\d+(?:${QUANTITY_HORIZONTAL_SPACE_PATTERN}+\\d+)*(?:[,.]\\d+)?)(${QUANTITY_HORIZONTAL_SPACE_PATTERN}+(?:${QUANTITY_SCALE_PATTERN})(?=$|[^${LETTERS}]))?(?=$|[^${LETTERS}\\d])`,
  "gi"
);
const LEADING_CURRENCY_RANGE_PATTERN = new RegExp(
  `([${QUANTITY_CURRENCY_SYMBOLS}])[ \\t\\u00A0\\u2009\\u202F]*(${QUANTITY_NUMBER_TOKEN_PATTERN})[ \\t\\u00A0\\u2009\\u202F]*(?:—|–|-|−)[ \\t\\u00A0\\u2009\\u202F]*([${QUANTITY_CURRENCY_SYMBOLS}])[ \\t\\u00A0\\u2009\\u202F]*(${QUANTITY_NUMBER_TOKEN_PATTERN})`,
  "g"
);
const QUANTITY_CURRENCY_CODES = new Set([
  "RUB", "RUR", "USD", "EUR", "GBP", "CHF", "CNY", "JPY", "KZT", "BYN", "UAH", "AMD", "GEL", "TRY", "AED", "SAR", "QAR", "ILS", "INR", "KRW", "THB", "VND", "IDR", "MYR", "SGD", "HKD", "AUD", "NZD", "CAD", "NOK", "SEK", "DKK", "PLN", "CZK", "HUF", "RSD", "BGN", "MDL", "AZN", "KGS", "TJS", "TMT", "UZS", "MNT", "BRL", "MXN", "ARS", "CLP", "COP", "ZAR", "EGP",
]);
const QUANTITY_CURRENCY_WORDS = new Set([
  ..."рубль рубля рублей копейка копейки копеек доллар доллара долларов цент цента центов евро евроцент евроцента евроцентов фунт фунта фунтов пенс пенса пенсов юань юаня юаней цзяо иена иены иен тенге гривна гривны гривен лари тетри драм драма драмов лума лумы лум лира лиры лир куруш куруша курушей франк франка франков злотый злотых грош гроша грошей крона кроны крон эре рупия рупии рупий пайс пайса пайсов пайсы шекель шекеля шекелей агора агоры агор дирхам дирхама дирхамов филс филса филсов риал риала риалов халала бат бата батов сатанг сатанга сатангов вона воны вон донг донга донгов песо реал реала реалов руб руб. коп коп. долл долл.".split(" "),
  "белорусский рубль", "белорусских рубля", "белорусских рублей",
]);
const QUANTITY_MULTIWORD_FORMS = new Set([
  "п. п.", "процентный пункт", "процентных пункта", "процентных пунктов", "процентного пункта",
  "квадратный миллиметр", "квадратных миллиметра", "квадратных миллиметров", "квадратный сантиметр", "квадратных сантиметра", "квадратных сантиметров", "квадратный метр", "квадратных метра", "квадратных метров", "квадратный километр", "квадратных километра", "квадратных километров",
  "кубический миллиметр", "кубических миллиметра", "кубических миллиметров", "кубический сантиметр", "кубических сантиметра", "кубических сантиметров", "кубический метр", "кубических метра", "кубических метров", "кубический километр", "кубических километра", "кубических километров",
  "градус Цельсия", "градуса Цельсия", "градусов Цельсия", "градус Фаренгейта", "градуса Фаренгейта", "градусов Фаренгейта", "мм рт. ст.", "миллиметр ртутного столба", "миллиметра ртутного столба", "миллиметров ртутного столба",
  "кв. мм", "кв. см", "кв. м", "кв. км", "куб. мм", "куб. см", "куб. м", "куб. км", "руб./кв. м",
]);
const QUANTITY_MARKER_FORMS = new Set(
  (
    "тыс тыс. млн млрд трлн % ‰ процент процента процентов промилле п.п. пп. " +
    "нм мкм мм см дм м км мм² см² дм² м² км² мм³ см³ дм³ м³ км³ мкл мл сл дл л " +
    "мкг мг г кг ц т мс с сек сек. мин мин. ч сут сут. нед нед. мес мес. Гц кГц МГц ГГц " +
    "° °C °С °F K мВ В кВ мА А кА мВт Вт кВт МВт ГВт Вт·ч кВт·ч МВт·ч Ом кОм МОм Дж кДж МДж кал ккал " +
    "Н кН МН Н·м кН·м Па кПа МПа бар мбар атм атм. бит байт КБ МБ ГБ ТБ Кбит Мбит Гбит пикс пикс. px dpi ppi lpi " +
    "лм лк кд дБ моль ммоль моль/л ммоль/л об/мин об./мин. рад шт шт. ед ед. чел чел. экз экз. компл компл. упак упак. наб наб. пар пар. поз поз. мест мест. " +
    "км/ч м/с кг/м³ руб./мес. руб./кв. м ₽/мес. ₽/м² Кбит/с Мбит/с Гбит/с шт./упак. чел./ч кв. мм кв. см кв. м кв. км куб. мм куб. см куб. м куб. км"
  ).split(" ")
);
QUANTITY_MARKER_FORMS.delete("кв.");
QUANTITY_MARKER_FORMS.delete("куб.");
QUANTITY_MARKER_FORMS.delete("руб./кв.");
const QUANTITY_FULL_WORD_FORMS = new Set(
  (
    "тысяча тысячи тысяч миллион миллиона миллионов миллиард миллиарда миллиардов триллион триллиона триллионов квадриллион квадриллиона квадриллионов квинтиллион квинтиллиона квинтиллионов секстиллион секстиллиона секстиллионов септиллион септиллиона септиллионов октиллион октиллиона октиллионов нониллион нониллиона нониллионов дециллион дециллиона дециллионов " +
    "нанометр нанометра нанометров микрометр микрометра микрометров миллиметр миллиметра миллиметров сантиметр сантиметра сантиметров дециметр дециметра дециметров метр метра метров километр километра километров микролитр микролитра микролитров миллилитр миллилитра миллилитров сантилитр сантилитра сантилитров децилитр децилитра децилитров литр литра литров " +
    "микрограмм микрограмма микрограммов миллиграмм миллиграмма миллиграммов грамм грамма граммов килограмм килограмма килограммов центнер центнера центнеров тонна тонны тонн миллисекунда миллисекунды миллисекунд секунда секунды секунд минута минуты минут час часа часов сутки суток неделя недели недель месяц месяца месяцев герц герца килогерц килогерца мегагерц мегагерца гигагерц гигагерца " +
    "градус градуса градусов кельвин кельвина кельвинов вольт вольта милливольт милливольта киловольт киловольта ампер ампера миллиампер миллиампера килоампер килоампера ватт ватта милливатт милливатта киловатт киловатта мегаватт мегаватта гигаватт гигаватта ом ома омов килоом килоома килоомов мегаом мегаома мегаомов джоуль джоуля джоулей килоджоуль килоджоуля килоджоулей мегаджоуль мегаджоуля мегаджоулей калория калории калорий килокалория килокалории килокалорий ньютон ньютона ньютонов килоньютон килоньютона килоньютонов меганьютон меганьютона меганьютонов паскаль паскаля паскалей килопаскаль килопаскаля килопаскалей мегапаскаль мегапаскаля мегапаскалей атмосфера атмосферы атмосфер пиксель пикселя пикселей люмен люмена люменов люкс люкса люксов кандела канделы кандел децибел децибела децибелов радиан радиана радианов"
  ).split(" ")
);
const QUANTITY_PROTECTIVE_LABELS = [
  "ID транзакции", "номер счёта", "лицевой счёт", "номер карты", "номер заказа", "номер заявки", "номер договора", "номер чека", "ID", "UID", "UUID", "№", "§", "#", "артикул", "SKU", "ISBN", "IMEI", "IBAN", "номер", "серия", "р/с", "к/с", "ИНН", "КПП", "БИК", "СНИЛС", "ОГРН", "ОГРНИП", "телефон",
].sort((first, second) => second.length - first.length);
type PreservedStyleField =
  | "boundVariables"
  | "fillStyleId"
  | "fontName"
  | "fontSize"
  | "fontStyle"
  | "fontWeight"
  | "fills"
  | "hyperlink"
  | "openTypeFeatures"
  | "textCase"
  | "textDecoration"
  | "textDecorationColor"
  | "textDecorationOffset"
  | "textDecorationSkipInk"
  | "textDecorationStyle"
  | "textDecorationThickness"
  | "letterSpacing"
  | "lineHeight"
  | "listOptions"
  | "listSpacing"
  | "indentation"
  | "paragraphIndent"
  | "paragraphSpacing"
  | "textStyleId"
  | "textStyleOverrides";

const STYLE_FIELDS: PreservedStyleField[] = [
  "boundVariables",
  "fillStyleId",
  "fontName",
  "fontSize",
  "fontStyle",
  "fontWeight",
  "fills",
  "hyperlink",
  "openTypeFeatures",
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

type TypographMode = "beauty" | "development";
type TextWriteStrategy = "full" | "point";
type QuoteScript = "cyrillic" | "latin";
type PluginRunSource = "quick_run" | "settings";
type AnalyticsRunMode = "default" | TypographMode;
type SelectionScope = "single_text" | "container" | "page" | "multi_selection";
type AnalyticsEventName =
  | "settings_opened"
  | "plugin_run_started"
  | "plugin_run_completed"
  | "plugin_run_failed"
  | "channel_link_clicked"
  | "website_link_clicked";
type AnalyticsErrorStage =
  | "collect_nodes"
  | "development_markers"
  | "load_fonts"
  | "read_styles"
  | "clean_text"
  | "compare_text"
  | "write_text"
  | "restore_styles"
  | "rollback_styles"
  | "unknown";
type AnalyticsErrorCategory =
  | "font_unavailable"
  | "layer_not_editable"
  | "layer_changed"
  | "mixed_or_unsupported_property"
  | "write_text_failed"
  | "restore_styles_failed"
  | "rollback_failed"
  | "typography_failed"
  | "timeout"
  | "unknown";
type TextLayerRollbackFailureReason =
  | "mutation_journal_missing"
  | "mutation_journal_not_invertible"
  | "mutation_journal_text_mismatch"
  | "rollback_plan_mismatch"
  | "text_restore_mismatch"
  | "snapshot_verification_failed"
  | "operation_failed";
type TextLayerRollbackOperation =
  | "verify_initial_snapshot"
  | "validate_mutation_journal"
  | "apply_inverse_text_mutations"
  | "plan_text_rollback"
  | "apply_planned_text_rollback"
  | "verify_restored_text"
  | "restore_development_marker_data"
  | "restore_development_marker_fills"
  | "verify_snapshot_after_marker_restore"
  | "restore_whole_text_style"
  | "restore_range_text_styles"
  | "verify_final_snapshot";
type TextLayerSnapshotVerificationFailure =
  | "text"
  | "styles"
  | "development_marker_fills"
  | "development_marker_indexes_data"
  | "development_marker_text_data"
  | "component_property_references"
  | "parent_chain";
type TypographyRuleCode =
  | "quote_ru_levels"
  | "quote_latin_levels"
  | "quote_context_script"
  | "quote_punctuation_outside"
  | "quote_ellipsis_position"
  | "quote_question_exclamation"
  | "punctuation_ellipsis"
  | "punctuation_repeated_marks"
  | "punctuation_question_exclamation_order"
  | "dash_between_words"
  | "range_simple"
  | "range_simple_number"
  | "range_simple_word_date"
  | "range_simple_time"
  | "range_simple_short_date"
  | "range_simple_roman"
  | "range_compound"
  | "range_compound_grouped_number"
  | "range_compound_full_date"
  | "range_compound_word_date"
  | "range_compound_quarter"
  | "range_compound_open_year"
  | "hyphen_nonbreaking_words"
  | "dash_line_start"
  | "dash_nbsp_before"
  | "phone_ru_format"
  | "phone_ru_separators"
  | "phone_ru_prefix_seven"
  | "phone_ru_prefix_eight"
  | "phone_protected_contexts"
  | "number_group_digits"
  | "number_decimal_comma"
  | "number_document_outline"
  | "number_western_format"
  | "number_unit_currency_nbsp"
  | "year_context"
  | "number_protect_ip"
  | "number_protect_version"
  | "number_protect_date"
  | "number_protect_code"
  | "number_protect_sign"
  | "abbr_dotted"
  | "abbr_compound"
  | "abbr_undotted_large_number"
  | "abbr_undotted_hyphenated"
  | "abbr_undotted_units"
  | "abbr_area_volume"
  | "abbr_month"
  | "abbr_sentence_end"
  | "abbr_line_break"
  | "nbsp_before_dash"
  | "nbsp_after_number_sign"
  | "nbsp_copyright_year"
  | "nbsp_number_unit"
  | "nbsp_percent_metric"
  | "nbsp_calendar_date"
  | "nbsp_initials"
  | "nbsp_particles"
  | "nbsp_short_cyrillic_words"
  | "space_collapse"
  | "space_trim_lines"
  | "space_before_punctuation"
  | "space_after_opening_punctuation"
  | "space_percent"
  | "space_tilde"
  | "math_expression_spacing"
  | "math_multiplication"
  | "math_basic_operators"
  | "math_subtraction_context"
  | "math_negative_number"
  | "math_fractions"
  | "temperature_degree_only"
  | "temperature_scale"
  | "temperature_range"
  | "percent_range"
  | "symbol_legal_marks"
  | "symbol_arrow";
const TYPOGRAPHY_RULE_CODES: TypographyRuleCode[] = [
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
type AnalyticsPropertyValue = string | number | boolean | null;
type AnalyticsProperties = Record<string, AnalyticsPropertyValue>;

interface PluginRunOptions {
  mode: TypographMode;
  processHiddenNodes: boolean;
  processLockedNodes: boolean;
  recolorExistingAsterisks: boolean;
}

interface PluginUIMessage {
  nodeId?: string;
  options?: Partial<PluginRunOptions>;
  type?: string;
}

interface PluginRunOutcome {
  error: boolean;
  message: string;
  report: ErrorReport | null;
}

type ProblemLayerKind = "safe_failure" | "critical_integrity" | "not_reached";
type ErrorReportKind = "safe_failure" | "critical_failure" | "startup_failure";

interface ProblemLayerReportItem {
  kind: ProblemLayerKind;
  nodeId: string;
  nodePath: string;
  textPreview: string;
}

interface ErrorReport {
  kind: ErrorReportKind;
  layers: ProblemLayerReportItem[];
  source: PluginRunSource;
  successfulLayerCount: number;
}

interface AnalyticsIdentity {
  anonymousId: string;
  distinctId: string;
  identityType: "anonymous" | "identified";
  userId: string | null;
}

interface SelectionAnalyticsSummary {
  scope: SelectionScope;
  selectedNodesCount: number;
  selectedTextNodesCount: number;
}

interface AnalyticsRunContext {
  mode: AnalyticsRunMode;
  options: PluginRunOptions;
  runId: string;
  selection: SelectionAnalyticsSummary;
  source: PluginRunSource;
  startedAt: number;
}

interface AnalyticsPayload {
  distinct_id: string;
  event: AnalyticsEventName;
  properties: AnalyticsProperties;
  timestamp: string;
  uuid: string;
}

interface QueuedAnalyticsEvent {
  attempts: number;
  id: string;
  payload: AnalyticsPayload;
}

interface QuoteState {
  script: QuoteScript;
  level: number;
}

interface TextProcessResult {
  processed: number;
  successful: number;
  changed: number;
  failed: number;
  failureDiagnostic: AnalyticsErrorDiagnostic | null;
  failedStage: AnalyticsErrorStage | null;
  originalFailureDiagnostic: AnalyticsErrorDiagnostic | null;
  originalFailureStage: AnalyticsErrorStage | null;
  rollbackFailureDiagnostic: TextLayerRollbackFailureDiagnostic | null;
  requiresStyleWarning: boolean;
  textLayerContentChanged: boolean;
  skippedHidden: number;
  skippedLocked: number;
  problemLayers: ProblemLayerReportItem[];
  numberDiagnostics: NumberDiagnosticCase[];
  analytics: TextProcessAnalytics;
}

type NumberDiagnosticStatus = "changed" | "skipped_policy" | "already_correct" | "review";
type NumberDiagnosticLayerMode = "single" | "multiple";
type NumberDiagnosticNeighborRole = "context" | "evidence" | "protection" | "separator";

interface NumberDiagnosticNeighbor {
  direction: "left" | "right";
  role: NumberDiagnosticNeighborRole;
  text: string;
  usedAsEvidence: boolean;
}

interface NumberDiagnosticCase {
  afterText: string;
  beforeText: string;
  id: string;
  layerMode: NumberDiagnosticLayerMode;
  neighbors: NumberDiagnosticNeighbor[];
  numberAfter: string;
  numberBefore: string;
  numberKind: string;
  numberRulesVersion: string;
  reason: string;
  ruleCodes: string[];
  status: NumberDiagnosticStatus;
}

interface NumberDiagnosticsPayload {
  capturedAt: string;
  cases: NumberDiagnosticCase[];
  pluginRelease: string;
  runId: string;
  schemaVersion: number;
}

interface QueuedNumberDiagnosticsPayload {
  attempts: number;
  id: string;
  payload: NumberDiagnosticsPayload;
}

interface AnalyticsErrorDiagnostic {
  category: AnalyticsErrorCategory;
  fingerprint: string;
  location: string;
  name: string;
  operation: string;
}

interface TextLayerRollbackFailureDiagnostic {
  errorFingerprint: string | null;
  errorName: string | null;
  operation: TextLayerRollbackOperation;
  reason: TextLayerRollbackFailureReason;
  verificationFailures: TextLayerSnapshotVerificationFailure[];
}

interface TextLayerRollbackResult {
  failureDiagnostic: TextLayerRollbackFailureDiagnostic | null;
  succeeded: boolean;
}

interface TextCollectionResult {
  nodes: TextNode[];
  skippedHidden: number;
  skippedLocked: number;
}

interface TextProcessTimings {
  typography: number;
  numberContext: number;
  pointEditPlanning: number;
  fonts: number;
  readStyles: number;
  compareText: number;
  writeText: number;
  restoreStyles: number;
  developmentMarkers: number;
}

interface TextProcessAnalytics {
  charactersChangedTotal: number;
  charactersProcessedTotal: number;
  largestTextLayerCharacters: number;
  pointEditMaxOperationsCount: number;
  pointEditMismatchLayersCount: number;
  pointEditOperationsCount: number;
  pointEditPlannedLayersCount: number;
  rollbackAttemptedLayersCount: number;
  rollbackFailedLayersCount: number;
  slowestTextLayerMs: number;
  styleSegmentsCount: number;
  timings: TextProcessTimings;
  uniqueFontsCount: number;
  ruleAnalytics: TypographyRuleAnalyticsSummary;
}

interface TypographyRuleMetric {
  calls: number;
  changedApplications: number;
  changedTextLayers: Set<number>;
  durationMs: number;
}

interface TypographyRuleAnalyticsCollector {
  changePairs: Map<string, number>;
  currentTextLayerIndex: number;
  failedRuleCode: TypographyRuleCode | null;
  metrics: Map<TypographyRuleCode, TypographyRuleMetric>;
  pendingChangedApplications: Map<TypographyRuleCode, number>;
  pendingChangeSequence: TypographyRuleCode[];
}

interface TypographyRuleMetricSummary {
  calls: number;
  changedApplications: number;
  changedTextLayers: number;
  durationMs: number;
}

interface TypographyRuleAnalyticsSummary {
  changePairs: Record<string, number>;
  changedCodes: TypographyRuleCode[];
  failedRuleCode: TypographyRuleCode | null;
  measuredCodesCount: number;
  metrics: Partial<Record<TypographyRuleCode, TypographyRuleMetricSummary>>;
  mostActiveRuleCode: TypographyRuleCode | null;
  mostActiveRuleChangedLayers: number;
  slowestRuleCode: TypographyRuleCode | null;
  slowestRuleDurationMs: number;
}

interface StyleRestorationPlan {
  styleMap: number[];
  wholeTextStyle: StyleSegment | null;
  verifyUniformLinkedStyle: boolean;
}

interface TextLayerStateSnapshot {
  componentPropertyReferences: Record<string, string> | null;
  developmentMarkerFills: Array<{ fills: Paint[]; index: number }>;
  developmentMarkerIndexesPluginData: string;
  developmentMarkerTextPluginData: string;
  parentChainIds: string[];
  styles: StyleSegment[];
  text: string;
  textNode: TextNode;
}

interface TypographyCleanResult {
  text: string;
  developmentMarkerIndexes: number[];
}

interface PointTextEdit {
  start: number;
  end: number;
  insertText: string;
}

interface PointTextInverseOperation {
  end?: number;
  start: number;
  text?: string;
  type: "delete" | "insert";
  useStyle?: "AFTER" | "BEFORE";
}

interface PointTextMutationJournal {
  canInvert: boolean;
  expectedText: string;
  inverseOperations: PointTextInverseOperation[];
}

interface PointEditTextSegment {
  start: number;
  end: number;
  text: string;
}

interface PointEditDiffStep {
  type: "delete" | "equal" | "insert";
  text: string;
}

interface PointTextEditPlanResult {
  edits: PointTextEdit[];
  matches: boolean;
  operationsCount: number;
}

interface MathExpressionParseResult {
  end: number;
  text: string;
}

interface MathNumberParseResult {
  end: number;
  hasUnaryMinus: boolean;
  text: string;
}

interface MathOperatorParseResult {
  end: number;
  text: string;
}

interface TextNodeLayoutInfo {
  box: Rect;
  containerId: string | null;
  id: string;
  text: string;
}

interface NumberDiagnosticLayoutInfo extends TextNodeLayoutInfo {
  ancestorIds: string[];
}

interface PhoneTailLayoutIndex {
  byCenterY: TextNodeLayoutInfo[];
  byX: TextNodeLayoutInfo[];
}

interface FontLoadingBudget {
  remainingMs: number;
}

type StyleSegment = Pick<StyledTextSegment, PreservedStyleField | "characters" | "start" | "end">;

const pendingAnalyticsEvents: Promise<void>[] = [];
let analyticsIdentityPromise: Promise<AnalyticsIdentity> | null = null;
let analyticsQueueOperation: Promise<void> = Promise.resolve();
let numberDiagnosticsQueueOperation: Promise<void> = Promise.resolve();
let typographRunPromise: Promise<void> | null = null;

async function run(): Promise<void> {
  try {
    if (figma.command === COMMAND_OPEN_SETTINGS) {
      openSettingsUI();
      return;
    }

    await runTypograph(getDefaultRunOptions(), "quick_run");
  } catch (error) {
    console.error("[Чистовик] Failed to clean typography", error);
    presentRunOutcome(
      {
        error: true,
        message: getFailureNotificationMessage(error),
        report: createStartupErrorReport("quick_run"),
      },
      "quick_run",
      true
    );
  }
}

function openSettingsUI(): void {
  try {
    showPluginUI();
    queueAnalyticsEvent("settings_opened", { source: "settings" });
  } catch (error) {
    console.error("[Чистовик] Failed to open settings UI", error);
    throw error;
  }
}

function showPluginUI(): void {
  figma.showUI(__html__, {
    height: 372,
    themeColors: true,
    width: 360,
  });
  configurePluginUIMessageHandler();
}

function configurePluginUIMessageHandler(): void {
  figma.ui.onmessage = async (message: PluginUIMessage) => {
    try {
      if (message.type === "close") {
        figma.closePlugin();
        return;
      }

      if (message.type === "select-problem-layer" && typeof message.nodeId === "string") {
        await selectProblemTextLayer(message.nodeId);
        return;
      }

      if (message.type === "channel-link-clicked") {
        queueAnalyticsEvent("channel_link_clicked", {
          link: "channel",
          source: "about_tab",
        });
        return;
      }

      if (message.type === "website-link-clicked") {
        queueAnalyticsEvent("website_link_clicked", {
          link: "website",
          source: "about_tab",
        });
        return;
      }

      if (message.type === "run-typograph") {
        await runTypograph(getRunOptionsFromMessage(message), "settings");
      }
    } catch (error) {
      console.error("[Чистовик] Failed to handle UI message", error);
      presentRunOutcome(
        {
          error: true,
          message: getFailureNotificationMessage(error),
          report: createStartupErrorReport("settings"),
        },
        "settings",
        true
      );
      postTypographRunFinished();
    }
  };
}

function runTypograph(options: PluginRunOptions, source: PluginRunSource): Promise<void> {
  if (typographRunPromise !== null) {
    return typographRunPromise;
  }

  const currentRunPromise = executeTypographRun(options, source);
  typographRunPromise = currentRunPromise;

  void currentRunPromise.then(
    () => {
      if (typographRunPromise === currentRunPromise) {
        typographRunPromise = null;
      }
    },
    () => {
      if (typographRunPromise === currentRunPromise) {
        typographRunPromise = null;
      }
    }
  );

  return currentRunPromise;
}

async function executeTypographRun(options: PluginRunOptions, source: PluginRunSource): Promise<void> {
  const analyticsContext = createAnalyticsRunContext(options, source);
  let analyticsStage: AnalyticsErrorStage = "unknown";
  let collectTextDuration = 0;
  let collection: TextCollectionResult | null = null;
  let result: TextProcessResult | null = null;
  let workingNotification: NotificationHandler | null = null;
  let outcome: PluginRunOutcome = {
    error: true,
    message: "Ой, не получилось почистить 🛑",
    report: null,
  };
  let workingNotificationCancelled = true;

  try {
    workingNotification = figma.notify("Чистовик работает...", { timeout: Infinity });
    queueAnalyticsEvent("plugin_run_started", getRunAnalyticsProperties(analyticsContext));
    figma.skipInvisibleInstanceChildren = !options.processHiddenNodes;

    analyticsStage = "collect_nodes";
    collection = await measureAsyncDuration(
      (duration) => {
        collectTextDuration += duration;
      },
      () =>
        collectTargetTextNodes({
          processHidden: options.processHiddenNodes,
          processLocked: options.processLockedNodes,
        })
    );
    analyticsStage = "clean_text";
    result = await processTextNodes(collection.nodes, collection.skippedLocked, collection.skippedHidden, options);
    queueNumberDiagnosticsReport(analyticsContext.runId, result.numberDiagnostics);

    if (result.failed > 0) {
      analyticsStage = result.failedStage ?? "unknown";
      const processingError = new Error(`Failed to process ${result.failed} text node(s)`);

      if (result.failureDiagnostic?.category === "rollback_failed" || result.requiresStyleWarning) {
        processingError.name = "RollbackFailureError";
      } else if (result.textLayerContentChanged) {
        processingError.name = TEXT_LAYER_CONTENT_CHANGED_ERROR_NAME;
      }

      throw processingError;
    }

    outcome = {
      error: false,
      message: getCleanResultNotificationMessage(result),
      report: null,
    };
    queueAnalyticsEvent("plugin_run_completed", {
      ...getRunAnalyticsProperties(analyticsContext),
      changed_anything: result.changed > 0,
      changed_text_layers_count: result.changed,
      characters_changed_total: result.analytics.charactersChangedTotal,
      characters_processed_total: result.analytics.charactersProcessedTotal,
      duration_ms: getAnalyticsDuration(analyticsContext),
      failed_text_layers_count: result.failed,
      found_text_layers_count: collection.nodes.length + collection.skippedHidden + collection.skippedLocked,
      largest_text_layer_characters: result.analytics.largestTextLayerCharacters,
      point_edit_max_operations_count: result.analytics.pointEditMaxOperationsCount,
      point_edit_mismatch_layers_count: result.analytics.pointEditMismatchLayersCount,
      point_edit_operations_count: result.analytics.pointEditOperationsCount,
      point_edit_planned_layers_count: result.analytics.pointEditPlannedLayersCount,
      processed_text_layers_count: result.processed,
      successful_text_layers_count: result.successful,
      rollback_attempted_layers_count: result.analytics.rollbackAttemptedLayersCount,
      rollback_failed_layers_count: result.analytics.rollbackFailedLayersCount,
      skipped_hidden_count: result.skippedHidden,
      skipped_locked_count: result.skippedLocked,
      slowest_text_layer_ms: result.analytics.slowestTextLayerMs,
      changed_style_segments_count: result.analytics.styleSegmentsCount,
      timing_collect_text_ms: collectTextDuration,
      ...getTextProcessTimingAnalyticsProperties(result.analytics.timings),
      ...getTypographyRuleAnalyticsProperties(result.analytics.ruleAnalytics),
      timing_other_ms: getOtherAnalyticsDuration(analyticsContext, collectTextDuration, result.analytics.timings),
      loaded_unique_fonts_count: result.analytics.uniqueFontsCount,
    });
  } catch (error) {
    console.error("[Чистовик] Failed to run typograph", error);
    const errorDiagnostic = result?.failureDiagnostic ?? createAnalyticsErrorDiagnostic(error, analyticsStage);
    queueAnalyticsEvent("plugin_run_failed", {
      ...getRunAnalyticsProperties(analyticsContext),
      duration_ms: getAnalyticsDuration(analyticsContext),
      error_category: errorDiagnostic.category,
      error_fingerprint: errorDiagnostic.fingerprint,
      error_location: errorDiagnostic.location,
      error_name: errorDiagnostic.name,
      error_operation: errorDiagnostic.operation,
      original_error_category: result?.originalFailureDiagnostic?.category ?? null,
      original_error_fingerprint: result?.originalFailureDiagnostic?.fingerprint ?? null,
      original_error_location: result?.originalFailureDiagnostic?.location ?? null,
      original_error_name: result?.originalFailureDiagnostic?.name ?? null,
      original_error_operation: result?.originalFailureDiagnostic?.operation ?? null,
      original_error_stage: result?.originalFailureStage ?? null,
      rollback_error_fingerprint: result?.rollbackFailureDiagnostic?.errorFingerprint ?? null,
      rollback_error_name: result?.rollbackFailureDiagnostic?.errorName ?? null,
      rollback_failure_operation: result?.rollbackFailureDiagnostic?.operation ?? null,
      rollback_failure_reason: result?.rollbackFailureDiagnostic?.reason ?? null,
      rollback_verification_failures:
        result?.rollbackFailureDiagnostic?.verificationFailures.join(",") || null,
      failed_text_layers_count: result?.failed ?? null,
      found_text_layers_count: collection === null ? null : collection.nodes.length + collection.skippedHidden + collection.skippedLocked,
      characters_changed_total: result?.analytics.charactersChangedTotal ?? null,
      characters_processed_total: result?.analytics.charactersProcessedTotal ?? null,
      largest_text_layer_characters: result?.analytics.largestTextLayerCharacters ?? null,
      point_edit_max_operations_count: result?.analytics.pointEditMaxOperationsCount ?? null,
      point_edit_mismatch_layers_count: result?.analytics.pointEditMismatchLayersCount ?? null,
      point_edit_operations_count: result?.analytics.pointEditOperationsCount ?? null,
      point_edit_planned_layers_count: result?.analytics.pointEditPlannedLayersCount ?? null,
      processed_text_layers_count: result?.processed ?? null,
      successful_text_layers_count: result?.successful ?? null,
      safe_failure_text_layers_count: result?.problemLayers.filter((layer) => layer.kind === "safe_failure").length ?? null,
      critical_integrity_text_layers_count:
        result?.problemLayers.filter((layer) => layer.kind === "critical_integrity").length ?? null,
      not_reached_text_layers_count: result?.problemLayers.filter((layer) => layer.kind === "not_reached").length ?? null,
      rollback_attempted_layers_count: result?.analytics.rollbackAttemptedLayersCount ?? null,
      rollback_failed_layers_count: result?.analytics.rollbackFailedLayersCount ?? null,
      slowest_text_layer_ms: result?.analytics.slowestTextLayerMs ?? null,
      stage: analyticsStage,
      changed_style_segments_count: result?.analytics.styleSegmentsCount ?? null,
      timing_collect_text_ms: collectTextDuration,
      ...(result === null ? {} : getTextProcessTimingAnalyticsProperties(result.analytics.timings)),
      ...(result === null ? {} : getTypographyRuleAnalyticsProperties(result.analytics.ruleAnalytics)),
      timing_other_ms: result === null ? null : getOtherAnalyticsDuration(analyticsContext, collectTextDuration, result.analytics.timings),
      loaded_unique_fonts_count: result?.analytics.uniqueFontsCount ?? null,
    });
    outcome = {
      error: true,
      message: getFailureNotificationMessage(error),
      report: result === null ? createStartupErrorReport(source) : createTextProcessErrorReport(result, source),
    };
  } finally {
    workingNotificationCancelled = cancelNotificationSafely(workingNotification);

    if (source === "settings") {
      postTypographRunFinished();
    }
  }

  presentRunOutcome(outcome, source, workingNotificationCancelled);
}

function postTypographRunFinished(): void {
  try {
    figma.ui.postMessage({ type: "typograph-run-finished" });
  } catch (error) {
    console.error("[Чистовик] Failed to reset typograph UI state", error);
  }
}

function cancelNotificationSafely(notification: NotificationHandler | null): boolean {
  try {
    notification?.cancel();
    return true;
  } catch (error) {
    console.error("[Чистовик] Failed to cancel notification", error);
    return false;
  }
}

function presentRunOutcome(outcome: PluginRunOutcome, source: PluginRunSource, workingNotificationCancelled: boolean): void {
  if (outcome.error && outcome.report != null) {
    showErrorReport(outcome.report);
    return;
  }

  if (source === "settings") {
    try {
      figma.notify(outcome.message, {
        error: outcome.error,
        timeout: FINAL_NOTIFICATION_TIMEOUT_MS,
      });
    } catch (error) {
      console.error("[Чистовик] Failed to show final settings notification", error);
    }

    return;
  }

  if (!workingNotificationCancelled) {
    closePluginWithMessageSafely(outcome.message);
    return;
  }

  let notificationFinished = false;
  let closeFallback: ReturnType<typeof setTimeout> | null = null;

  const finishQuickRun = (): void => {
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
  } catch (error) {
    console.error("[Чистовик] Failed to show final quick-run notification", error);
    closePluginWithMessageSafely(outcome.message);
  }
}

function createStartupErrorReport(source: PluginRunSource): ErrorReport {
  return {
    kind: "startup_failure",
    layers: [],
    source,
    successfulLayerCount: 0,
  };
}

function createTextProcessErrorReport(result: TextProcessResult, source: PluginRunSource): ErrorReport {
  return {
    kind: result.requiresStyleWarning ? "critical_failure" : "safe_failure",
    layers: result.problemLayers,
    source,
    successfulLayerCount: result.successful,
  };
}

function showErrorReport(report: ErrorReport): void {
  try {
    if (report.source === "quick_run") {
      showPluginUI();
    }

    figma.ui.postMessage({
      report,
      type: "show-error-report",
    });

  } catch (error) {
    console.error("[Чистовик] Failed to show error report", error);
    closePluginWithMessageSafely(getFailureNotificationMessage(error));
  }
}

async function selectProblemTextLayer(nodeId: string): Promise<void> {
  const requestId = problemLayerSelectionRequestId + 1;
  problemLayerSelectionRequestId = requestId;

  try {
    const node = await withFigmaOperationTimeout(() => figma.getNodeByIdAsync(nodeId), "problem_layer_lookup");

    if (requestId !== problemLayerSelectionRequestId || node === null || node.type !== "TEXT" || node.removed) {
      return;
    }

    const page = getNodePage(node);

    if (page === null) {
      return;
    }

    if (page.id !== figma.currentPage.id) {
      await withFigmaOperationTimeout(() => figma.setCurrentPageAsync(page), "problem_layer_page_switch");
    }

    if (requestId !== problemLayerSelectionRequestId || node.removed || figma.currentPage.id !== page.id) {
      return;
    }

    page.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);
  } catch (error) {
    console.error(`[Чистовик] Failed to select problem text layer ${nodeId}`, error);
  }
}

function getNodePage(node: BaseNode): PageNode | null {
  let current: BaseNode | null | undefined = node;

  while (current != null) {
    if (current.type === "PAGE") {
      return current;
    }

    current = "parent" in current ? current.parent : null;
  }

  return null;
}

async function closeQuickPluginAfterAnalyticsGrace(): Promise<void> {
  try {
    await waitForPendingAnalyticsEvents(ANALYTICS_CLOSE_GRACE_PERIOD_MS);
    figma.closePlugin();
  } catch (error) {
    console.error("[Чистовик] Failed to close quick-run plugin", error);
  }
}

function closePluginWithMessageSafely(message: string): void {
  try {
    figma.closePlugin(message);
  } catch (error) {
    console.error("[Чистовик] Failed to close plugin with final message", error);
  }
}

function getFailureNotificationMessage(error: unknown): string {
  try {
    if (getErrorName(error) === "RollbackFailureError") {
      return "Плагин случайно сломал какие-то стили — проверьте текстовые слои 🛑";
    }

    if (getErrorName(error) === TEXT_LAYER_CONTENT_CHANGED_ERROR_NAME) {
      return "Тут изменился текст — запустите типограф заново 🔄";
    }
  } catch {
    // Fall back to the regular error message.
  }

  return "Ой, не получилось почистить 🛑";
}

function createAnalyticsRunContext(options: PluginRunOptions, source: PluginRunSource): AnalyticsRunContext {
  try {
    return {
      mode: getAnalyticsRunMode(options, source),
      options,
      runId: createAnalyticsRunId(),
      selection: getSelectionAnalyticsSummary(figma.currentPage.selection),
      source,
      startedAt: getMonotonicTimeMs(),
    };
  } catch {
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

function getAnalyticsRunMode(options: PluginRunOptions, source: PluginRunSource): AnalyticsRunMode {
  try {
    return source === "quick_run" ? "default" : options.mode;
  } catch {
    return "default";
  }
}

function getSelectionAnalyticsSummary(selection: readonly SceneNode[]): SelectionAnalyticsSummary {
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
  } catch {
    return {
      scope: "page",
      selectedNodesCount: 0,
      selectedTextNodesCount: 0,
    };
  }
}

function getRunAnalyticsProperties(context: AnalyticsRunContext): AnalyticsProperties {
  try {
    return {
      mode: context.mode,
      process_hidden_nodes: context.options.processHiddenNodes,
      process_locked_nodes: context.options.processLockedNodes,
      recolor_existing_asterisks: context.options.recolorExistingAsterisks,
      performance_measurement_version: PERFORMANCE_MEASUREMENT_VERSION,
      point_editing_phase: POINT_EDITING_RUNTIME_PHASE,
      run_id: context.runId,
      selected_nodes_count: context.selection.selectedNodesCount,
      selected_text_nodes_count: context.selection.selectedTextNodesCount,
      selection_scope: context.selection.scope,
      source: context.source,
    };
  } catch {
    return {};
  }
}

function getAnalyticsDuration(context: AnalyticsRunContext): number {
  try {
    return Math.max(0, getMonotonicTimeMs() - context.startedAt);
  } catch {
    return 0;
  }
}

function getTextProcessTimingAnalyticsProperties(timings: TextProcessTimings): AnalyticsProperties {
  return {
    timing_compare_text_ms: timings.compareText,
    timing_development_markers_ms: timings.developmentMarkers,
    timing_fonts_ms: timings.fonts,
    timing_number_context_ms: timings.numberContext,
    timing_point_edit_planning_ms: timings.pointEditPlanning,
    timing_read_styles_ms: timings.readStyles,
    timing_restore_styles_ms: timings.restoreStyles,
    timing_typography_ms: timings.typography,
    timing_write_text_ms: timings.writeText,
  };
}

function getTypographyRuleAnalyticsProperties(summary: TypographyRuleAnalyticsSummary): AnalyticsProperties {
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
  } catch {
    return {
      rule_analytics_version: RULE_ANALYTICS_VERSION,
    };
  }
}

function getOtherAnalyticsDuration(context: AnalyticsRunContext, collectTextDuration: number, timings: TextProcessTimings): number {
  const measuredDuration =
    collectTextDuration +
    timings.typography +
    timings.numberContext +
    timings.pointEditPlanning +
    timings.fonts +
    timings.readStyles +
    timings.compareText +
    timings.writeText +
    timings.restoreStyles +
    timings.developmentMarkers;

  return Math.max(0, getAnalyticsDuration(context) - measuredDuration);
}

function measureDuration<T>(reportDuration: (duration: number) => void, operation: () => T): T {
  const startedAt = getMonotonicTimeMs();

  try {
    return operation();
  } finally {
    reportDuration(Math.max(0, getMonotonicTimeMs() - startedAt));
  }
}

async function measureAsyncDuration<T>(reportDuration: (duration: number) => void, operation: () => Promise<T>): Promise<T> {
  const startedAt = getMonotonicTimeMs();

  try {
    return await operation();
  } finally {
    reportDuration(Math.max(0, getMonotonicTimeMs() - startedAt));
  }
}

function getMonotonicTimeMs(): number {
  try {
    const runtime = globalThis as unknown as { performance?: { now?: () => number } };

    if (typeof runtime.performance?.now === "function") {
      return runtime.performance.now();
    }
  } catch {
    // Date.now is a safe fallback in runtimes without the high-resolution timer.
  }

  return Date.now();
}

function createTypographyRuleAnalyticsCollector(): TypographyRuleAnalyticsCollector {
  const metrics = new Map<TypographyRuleCode, TypographyRuleMetric>();

  for (const code of TYPOGRAPHY_RULE_CODES) {
    metrics.set(code, {
      calls: 0,
      changedApplications: 0,
      changedTextLayers: new Set<number>(),
      durationMs: 0,
    });
  }

  return {
    changePairs: new Map<string, number>(),
    currentTextLayerIndex: -1,
    failedRuleCode: null,
    metrics,
    pendingChangedApplications: new Map<TypographyRuleCode, number>(),
    pendingChangeSequence: [],
  };
}

function beginTypographyRuleAnalyticsTextLayer(collector: TypographyRuleAnalyticsCollector, textLayerIndex: number): void {
  try {
    collector.currentTextLayerIndex = textLayerIndex;
    collector.pendingChangedApplications.clear();
    collector.pendingChangeSequence = [];
  } catch {
    // Rule analytics must never affect typography.
  }
}

function finishTypographyRuleAnalyticsTextLayer(collector: TypographyRuleAnalyticsCollector, finalTextChanged: boolean): void {
  try {
    if (finalTextChanged && collector.currentTextLayerIndex >= 0) {
      for (const [code, changedApplications] of collector.pendingChangedApplications.entries()) {
        const metric = collector.metrics.get(code);

        if (metric === undefined) {
          continue;
        }

        metric.changedApplications += changedApplications;
        metric.changedTextLayers.add(collector.currentTextLayerIndex);
      }

      let previousCode: TypographyRuleCode | null = null;

      for (const code of collector.pendingChangeSequence) {
        if (previousCode !== null && previousCode !== code) {
          const pair = `${previousCode}>${code}`;
          collector.changePairs.set(pair, (collector.changePairs.get(pair) ?? 0) + 1);
        }

        previousCode = code;
      }
    }

    collector.currentTextLayerIndex = -1;
    collector.pendingChangedApplications.clear();
    collector.pendingChangeSequence = [];
  } catch {
    // Rule analytics must never affect typography.
  }
}

function applyTypographyRule(
  collector: TypographyRuleAnalyticsCollector | null,
  code: TypographyRuleCode,
  input: string,
  operation: (text: string) => string
): string {
  if (collector === null) {
    return operation(input);
  }

  const startedAt = getMonotonicTimeMs();

  try {
    const result = operation(input);
    recordTypographyRuleMetric(collector, code, Math.max(0, getMonotonicTimeMs() - startedAt), result !== input, true);
    return result;
  } catch (error) {
    collector.failedRuleCode = code;
    recordTypographyRuleMetric(collector, code, Math.max(0, getMonotonicTimeMs() - startedAt), false, true);
    throw error;
  }
}

function recordTypographyRuleDerivedChange(collector: TypographyRuleAnalyticsCollector | null, code: TypographyRuleCode): void {
  if (collector === null) {
    return;
  }

  recordTypographyRuleMetric(collector, code, 0, true, false);
}

function recordTypographyRuleObservation(collector: TypographyRuleAnalyticsCollector | null, code: TypographyRuleCode): void {
  if (collector === null) {
    return;
  }

  recordTypographyRuleMetric(collector, code, 0, false, false);
}

function recordTypographyRuleMetric(
  collector: TypographyRuleAnalyticsCollector,
  code: TypographyRuleCode,
  durationMs: number,
  changed: boolean,
  trackChangeSequence: boolean
): void {
  try {
    const existing = collector.metrics.get(code);
    const metric: TypographyRuleMetric =
      existing ?? {
        calls: 0,
        changedApplications: 0,
        changedTextLayers: new Set<number>(),
        durationMs: 0,
      };

    metric.calls += 1;
    metric.durationMs += durationMs;

    if (changed && collector.currentTextLayerIndex >= 0) {
      collector.pendingChangedApplications.set(code, (collector.pendingChangedApplications.get(code) ?? 0) + 1);

      if (trackChangeSequence) {
        collector.pendingChangeSequence.push(code);
      }
    }

    collector.metrics.set(code, metric);
  } catch {
    // Rule analytics must never affect typography.
  }
}

function createTypographyRuleAnalyticsSummary(collector: TypographyRuleAnalyticsCollector): TypographyRuleAnalyticsSummary {
  try {
    const metrics: Partial<Record<TypographyRuleCode, TypographyRuleMetricSummary>> = {};
    const changedCodes: TypographyRuleCode[] = [];
    let mostActiveRuleCode: TypographyRuleCode | null = null;
    let mostActiveRuleChangedLayers = 0;
    let slowestRuleCode: TypographyRuleCode | null = null;
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
  } catch {
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

function roundAnalyticsDuration(durationMs: number): number {
  return Math.round(Math.max(0, durationMs) * 1000) / 1000;
}

function queueAnalyticsEvent(event: AnalyticsEventName, properties: AnalyticsProperties = {}): void {
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
  } catch {
    // Analytics must never affect plugin behavior.
  }
}

async function waitForPendingAnalyticsEvents(timeoutMs: number): Promise<void> {
  try {
    if (pendingAnalyticsEvents.length === 0) {
      return;
    }

    await Promise.race([
      Promise.all(pendingAnalyticsEvents.slice()).then(() => undefined),
      delay(timeoutMs),
    ]);
  } catch {
    // Analytics must never affect plugin behavior.
  }
}

function delay(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  });
}

function withFigmaOperationTimeout<T>(operation: () => Promise<T>, operationName: string, timeoutMs: number = FIGMA_OPERATION_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      const error = new Error(`Figma operation timed out: ${operationName}`);
      error.name = "FigmaOperationTimeoutError";
      reject(error);
    }, timeoutMs);

    void Promise.resolve()
      .then(operation)
      .then(
        (result) => {
          if (settled) {
            return;
          }

          settled = true;
          clearTimeout(timeoutId);
          resolve(result);
        },
        (error) => {
          if (settled) {
            return;
          }

          settled = true;
          clearTimeout(timeoutId);
          reject(error);
        }
      );
  });
}

function withFigmaOperationDeadline<T>(operation: () => Promise<T>, operationName: string, deadlineAt: number): Promise<T> {
  const remainingMs = Math.floor(deadlineAt - Date.now());

  if (remainingMs <= 0) {
    const error = new Error(`Figma operation timed out: ${operationName}`);
    error.name = "FigmaOperationTimeoutError";
    return Promise.reject(error);
  }

  return withFigmaOperationTimeout(operation, operationName, remainingMs);
}

function assertOperationDeadline(deadlineAt: number | undefined, operationName: string): void {
  if (deadlineAt !== undefined && Date.now() >= deadlineAt) {
    const error = new Error(`Figma operation timed out: ${operationName}`);
    error.name = "FigmaOperationTimeoutError";
    throw error;
  }
}

function withBoundedFigmaOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  deadlineAt?: number
): Promise<T> {
  return deadlineAt === undefined
    ? withFigmaOperationTimeout(operation, operationName)
    : withFigmaOperationDeadline(operation, operationName, deadlineAt);
}

async function trackAnalyticsEvent(event: AnalyticsEventName, properties: AnalyticsProperties = {}, capturedAt: string = new Date().toISOString(), eventId: string = createAnalyticsEventId()): Promise<void> {
  try {
    const identity = await getAnalyticsIdentity();
    const payload = createAnalyticsEventPayload(event, properties, identity, capturedAt, eventId);

    await enqueueAnalyticsEvent(payload, eventId);
    await flushQueuedAnalyticsEvents();
  } catch {
    // Analytics must never affect plugin behavior.
  }
}

function createAnalyticsEventPayload(event: AnalyticsEventName, properties: AnalyticsProperties, identity: AnalyticsIdentity, capturedAt: string, eventUuid: string = createAnalyticsEventId()): AnalyticsPayload {
  return {
    distinct_id: identity.distinctId,
    event,
    properties: {
      ...properties,
      $geoip_disable: true,
      $process_person_profile: false,
      analytics_schema_version: ANALYTICS_SCHEMA_VERSION,
      identity_type: identity.identityType,
      plugin_release: ANALYTICS_PLUGIN_RELEASE,
    },
    timestamp: capturedAt,
    uuid: isValidAnalyticsUuid(eventUuid) ? eventUuid : createAnalyticsEventUuidFromSeed(eventUuid),
  };
}

function getAnalyticsCaptureEndpoint(): string {
  return `${ANALYTICS_API_HOST}${ANALYTICS_CAPTURE_PATH}`;
}

async function enqueueAnalyticsEvent(payload: AnalyticsPayload, eventId: string): Promise<void> {
  await runAnalyticsQueueOperation(async () => {
    const queue = await readQueuedAnalyticsEvents();
    const nextEvent: QueuedAnalyticsEvent = {
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

async function flushQueuedAnalyticsEvents(): Promise<void> {
  await runAnalyticsQueueOperation(async () => {
    const queue = await readQueuedAnalyticsEvents();

    if (queue.length === 0) {
      return;
    }

    const remainingQueue: QueuedAnalyticsEvent[] = [];

    for (const queuedEvent of queue) {
      try {
        await sendAnalyticsPayload(queuedEvent.payload);
      } catch {
        remainingQueue.push({
          ...queuedEvent,
          attempts: queuedEvent.attempts + 1,
        });
      }
    }

    await writeQueuedAnalyticsEvents(remainingQueue.slice(-ANALYTICS_MAX_QUEUED_EVENTS));
  });
}

async function sendAnalyticsPayload(payload: AnalyticsPayload): Promise<void> {
  const response = await fetch(getAnalyticsCaptureEndpoint(), {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Analytics capture failed: ${response.status}`);
  }
}

function isNumberDiagnosticsCollectionOpen(now: Date = new Date()): boolean {
  try {
    return now.getTime() < NUMBER_DIAGNOSTICS_END_AT_MS;
  } catch {
    return false;
  }
}

function truncateNumberDiagnosticText(value: string, maximumLength: number = NUMBER_DIAGNOSTICS_MAX_TEXT_LENGTH): string {
  if (value.length <= maximumLength) {
    return value;
  }

  const half = Math.floor((maximumLength - 3) / 2);
  return `${value.slice(0, half)}…${value.slice(value.length - half)}`;
}

function getUtf8ByteLength(value: string): number {
  let length = 0;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);

    if (code < 0x80) {
      length += 1;
    } else if (code < 0x800) {
      length += 2;
    } else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);

      if (next >= 0xdc00 && next <= 0xdfff) {
        length += 4;
        index += 1;
      } else {
        length += 3;
      }
    } else {
      length += 3;
    }
  }

  return length;
}

function normalizeNumberDiagnosticCaseForSending(item: NumberDiagnosticCase): NumberDiagnosticCase {
  return {
    ...item,
    afterText: truncateNumberDiagnosticText(item.afterText),
    beforeText: truncateNumberDiagnosticText(item.beforeText),
    neighbors: item.neighbors.map((neighbor) => ({
      ...neighbor,
      text: truncateNumberDiagnosticText(neighbor.text),
    })),
    numberAfter: truncateNumberDiagnosticText(item.numberAfter, 1000),
    numberBefore: truncateNumberDiagnosticText(item.numberBefore, 1000),
  };
}

function createNumberDiagnosticsPayloads(runId: string, cases: NumberDiagnosticCase[], capturedAt: string): NumberDiagnosticsPayload[] {
  try {
    const payloads: NumberDiagnosticsPayload[] = [];
    let currentCases: NumberDiagnosticCase[] = [];

    const finishCurrentPayload = (): void => {
      if (currentCases.length === 0) {
        return;
      }

      payloads.push({
        capturedAt,
        cases: currentCases,
        pluginRelease: ANALYTICS_PLUGIN_RELEASE,
        runId,
        schemaVersion: NUMBER_DIAGNOSTICS_SCHEMA_VERSION,
      });
      currentCases = [];
    };

    for (const originalCase of cases) {
      const item = normalizeNumberDiagnosticCaseForSending(originalCase);
      const tentativeCases = [...currentCases, item];
      const tentativePayload: NumberDiagnosticsPayload = {
        capturedAt,
        cases: tentativeCases,
        pluginRelease: ANALYTICS_PLUGIN_RELEASE,
        runId,
        schemaVersion: NUMBER_DIAGNOSTICS_SCHEMA_VERSION,
      };
      const payloadBytes = getUtf8ByteLength(JSON.stringify(tentativePayload));

      if (
        currentCases.length > 0 &&
        (tentativeCases.length > NUMBER_DIAGNOSTICS_MAX_CASES_PER_PAYLOAD || payloadBytes > NUMBER_DIAGNOSTICS_MAX_PAYLOAD_BYTES)
      ) {
        finishCurrentPayload();
      }

      currentCases.push(item);
    }

    finishCurrentPayload();
    return payloads;
  } catch (error) {
    console.error("[Чистовик] Failed to prepare number diagnostics payloads", error);
    return [];
  }
}

function queueNumberDiagnosticsReport(runId: string, cases: NumberDiagnosticCase[]): void {
  try {
    if (cases.length === 0 || !isNumberDiagnosticsCollectionOpen()) {
      return;
    }

    const capturedAt = new Date().toISOString();

    for (const payload of createNumberDiagnosticsPayloads(runId, cases, capturedAt)) {
      const reportId = createAnalyticsEventId();
      const promise = trackNumberDiagnosticsPayload(payload, reportId);
      pendingAnalyticsEvents.push(promise);

      void promise.finally(() => {
        const index = pendingAnalyticsEvents.indexOf(promise);

        if (index !== -1) {
          pendingAnalyticsEvents.splice(index, 1);
        }
      });
    }
  } catch {
    // Number diagnostics must never affect typography.
  }
}

async function trackNumberDiagnosticsPayload(payload: NumberDiagnosticsPayload, reportId: string): Promise<void> {
  try {
    await enqueueNumberDiagnosticsPayload(payload, reportId);
    await flushQueuedNumberDiagnosticsPayloads();
  } catch {
    // Number diagnostics must never affect typography.
  }
}

async function enqueueNumberDiagnosticsPayload(payload: NumberDiagnosticsPayload, reportId: string): Promise<void> {
  await runNumberDiagnosticsQueueOperation(async () => {
    const queue = await readQueuedNumberDiagnosticsPayloads();
    const next: QueuedNumberDiagnosticsPayload = {
      attempts: 0,
      id: reportId,
      payload,
    };
    const nextQueue = queue
      .filter((queued) => queued.id !== reportId)
      .concat(next)
      .slice(-NUMBER_DIAGNOSTICS_MAX_QUEUED_REPORTS);
    await figma.clientStorage.setAsync(NUMBER_DIAGNOSTICS_QUEUE_KEY, nextQueue);
  });
}

async function readQueuedNumberDiagnosticsPayloads(): Promise<QueuedNumberDiagnosticsPayload[]> {
  try {
    const stored = await figma.clientStorage.getAsync(NUMBER_DIAGNOSTICS_QUEUE_KEY);

    if (!Array.isArray(stored)) {
      return [];
    }

    return stored.filter((item): item is QueuedNumberDiagnosticsPayload => {
      if (item === null || typeof item !== "object") {
        return false;
      }

      const candidate = item as Partial<QueuedNumberDiagnosticsPayload>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.attempts === "number" &&
        candidate.payload !== null &&
        typeof candidate.payload === "object" &&
        Array.isArray(candidate.payload.cases)
      );
    });
  } catch {
    return [];
  }
}

async function flushQueuedNumberDiagnosticsPayloads(): Promise<void> {
  await runNumberDiagnosticsQueueOperation(async () => {
    const queue = await readQueuedNumberDiagnosticsPayloads();

    if (queue.length === 0) {
      return;
    }

    if (!isNumberDiagnosticsCollectionOpen()) {
      await figma.clientStorage.setAsync(NUMBER_DIAGNOSTICS_QUEUE_KEY, []);
      return;
    }

    const remaining: QueuedNumberDiagnosticsPayload[] = [];

    for (const queued of queue) {
      try {
        await sendNumberDiagnosticsPayload(queued.payload);
      } catch {
        remaining.push({
          ...queued,
          attempts: queued.attempts + 1,
        });
      }
    }

    await figma.clientStorage.setAsync(NUMBER_DIAGNOSTICS_QUEUE_KEY, remaining.slice(-NUMBER_DIAGNOSTICS_MAX_QUEUED_REPORTS));
  });
}

async function sendNumberDiagnosticsPayload(payload: NumberDiagnosticsPayload): Promise<void> {
  const response = await fetch(`${ANALYTICS_API_HOST}${NUMBER_DIAGNOSTICS_CAPTURE_PATH}`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (response.status === 400 || response.status === 410 || response.status === 413) {
    return;
  }

  if (!response.ok) {
    throw new Error(`Number diagnostics capture failed: ${response.status}`);
  }
}

function runNumberDiagnosticsQueueOperation(operation: () => Promise<void>): Promise<void> {
  const nextOperation = numberDiagnosticsQueueOperation.then(operation, operation);

  numberDiagnosticsQueueOperation = nextOperation.then(
    () => undefined,
    () => undefined
  );

  return nextOperation;
}

function runAnalyticsQueueOperation(operation: () => Promise<void>): Promise<void> {
  const nextOperation = analyticsQueueOperation.then(operation, operation);

  analyticsQueueOperation = nextOperation.then(
    () => undefined,
    () => undefined
  );

  return nextOperation;
}

async function readQueuedAnalyticsEvents(): Promise<QueuedAnalyticsEvent[]> {
  const storedQueue = await figma.clientStorage.getAsync(ANALYTICS_EVENT_QUEUE_KEY);

  if (!Array.isArray(storedQueue)) {
    return [];
  }

  return storedQueue
    .map(toQueuedAnalyticsEvent)
    .filter((event): event is QueuedAnalyticsEvent => event !== null)
    .slice(-ANALYTICS_MAX_QUEUED_EVENTS);
}

async function writeQueuedAnalyticsEvents(queue: QueuedAnalyticsEvent[]): Promise<void> {
  await figma.clientStorage.setAsync(ANALYTICS_EVENT_QUEUE_KEY, queue);
}

function toQueuedAnalyticsEvent(value: unknown): QueuedAnalyticsEvent | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const event = value as Partial<QueuedAnalyticsEvent>;

  if (typeof event.id !== "string") {
    return null;
  }

  const payload = sanitizeAnalyticsPayload(event.payload, event.id);

  if (payload === null) {
    return null;
  }

  return {
    attempts: typeof event.attempts === "number" ? event.attempts : 0,
    id: event.id,
    payload,
  };
}

function sanitizeAnalyticsPayload(value: unknown, eventId: string): AnalyticsPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const payload = value as Partial<AnalyticsPayload>;

  if (
    typeof payload.distinct_id !== "string" ||
    typeof payload.event !== "string" ||
    typeof payload.properties !== "object" ||
    payload.properties === null ||
    typeof payload.timestamp !== "string"
  ) {
    return null;
  }

  return {
    distinct_id: payload.distinct_id,
    event: payload.event as AnalyticsEventName,
    properties: payload.properties as AnalyticsProperties,
    timestamp: payload.timestamp,
    uuid: typeof payload.uuid === "string" && isValidAnalyticsUuid(payload.uuid) ? payload.uuid : createAnalyticsEventUuidFromSeed(eventId),
  };
}

async function getAnalyticsIdentity(): Promise<AnalyticsIdentity> {
  if (analyticsIdentityPromise === null) {
    analyticsIdentityPromise = resolveAnalyticsIdentity();
  }

  return analyticsIdentityPromise;
}

async function resolveAnalyticsIdentity(): Promise<AnalyticsIdentity> {
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
  } catch {
    const anonymousId = createAnalyticsAnonymousId();

    return {
      anonymousId,
      distinctId: anonymousId,
      identityType: "anonymous",
      userId: null,
    };
  }
}

function createAnalyticsAnonymousId(): string {
  try {
    return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}_${Math.random().toString(36).slice(2, 12)}`;
  } catch {
    return "anon_fallback";
  }
}

function createAnalyticsEventId(): string {
  try {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
      const randomValue = Math.floor(Math.random() * 16);
      const value = character === "x" ? randomValue : (randomValue & 0x3) | 0x8;

      return value.toString(16);
    });
  } catch {
    return createAnalyticsEventUuidFromSeed(`fallback_${Date.now()}`);
  }
}

function isValidAnalyticsUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function createAnalyticsEventUuidFromSeed(seed: string): string {
  let hex = "";

  for (let block = 0; block < 4; block += 1) {
    let hash = 2166136261 ^ block;

    for (let index = 0; index < seed.length; index += 1) {
      hash ^= seed.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    hex += (hash >>> 0).toString(16).padStart(8, "0");
  }

  const normalizedHex = `${hex.slice(0, 12)}4${hex.slice(13, 16)}a${hex.slice(17, 32)}`;

  return `${normalizedHex.slice(0, 8)}-${normalizedHex.slice(8, 12)}-${normalizedHex.slice(12, 16)}-${normalizedHex.slice(16, 20)}-${normalizedHex.slice(20)}`;
}

function createAnalyticsRunId(): string {
  try {
    return `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}_${Math.random().toString(36).slice(2, 12)}`;
  } catch {
    return `run_fallback_${Date.now().toString(36)}`;
  }
}

function getErrorName(error: unknown): string {
  try {
    if (error instanceof Error && error.name !== "") {
      return error.name;
    }

    if (typeof error === "object" && error !== null && "name" in error && typeof error.name === "string" && error.name !== "") {
      return error.name;
    }

    return "UnknownError";
  } catch {
    return "UnknownError";
  }
}

function createErrorFingerprint(error: unknown): string {
  try {
    const name = getErrorName(error);
    const message = getErrorMessage(error);
    return hashAnalyticsString(`${name}:${message}`);
  } catch {
    return "unknown";
  }
}

function getErrorMessage(error: unknown): string {
  try {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
      return error.message;
    }

    return String(error);
  } catch {
    return "";
  }
}

function createAnalyticsErrorDiagnostic(error: unknown, stage: AnalyticsErrorStage): AnalyticsErrorDiagnostic {
  return {
    category: classifyAnalyticsError(error, stage),
    fingerprint: createErrorFingerprint(error),
    location: getAnalyticsErrorLocation(stage),
    name: getErrorName(error),
    operation: getAnalyticsErrorOperation(stage),
  };
}

function classifyAnalyticsError(error: unknown, stage: AnalyticsErrorStage): AnalyticsErrorCategory {
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

  if (/(removed|detached|deleted|invalid node|node.*not found|text layer changed)/.test(message)) {
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

function getAnalyticsErrorOperation(stage: AnalyticsErrorStage): string {
  const operations: Record<AnalyticsErrorStage, string> = {
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

function getAnalyticsErrorLocation(stage: AnalyticsErrorStage): string {
  const locations: Record<AnalyticsErrorStage, string> = {
    clean_text: "src/code.ts:cleanTypographyWithMetadata",
    collect_nodes: "src/code.ts:collectTargetTextNodes",
    compare_text: "src/code.ts:buildStyleMap",
    development_markers: "src/code.ts:applyDevelopmentMarkerStyles",
    load_fonts: "src/code.ts:loadFontsForTextNode",
    read_styles: "src/code.ts:captureTextStyles",
    restore_styles: "src/code.ts:restoreTextStyles",
    rollback_styles: "src/code.ts:restoreTextLayerSnapshot",
    unknown: "src/code.ts:runTypograph",
    write_text: "src/code.ts:processTextNodes/write_clean_text",
  };

  return locations[stage];
}

function hashAnalyticsString(input: string): string {
  try {
    let hash = 0;

    for (let index = 0; index < input.length; index += 1) {
      hash = (hash * 31 + input.charCodeAt(index)) | 0;
    }

    return Math.abs(hash).toString(36);
  } catch {
    return "unknown";
  }
}

function getDefaultRunOptions(): PluginRunOptions {
  try {
    return {
      mode: "beauty",
      processHiddenNodes: false,
      processLockedNodes: false,
      recolorExistingAsterisks: false,
    };
  } catch (error) {
    console.error("[Чистовик] Failed to get default run options", error);
    throw error;
  }
}

function getRunOptionsFromMessage(message: PluginUIMessage): PluginRunOptions {
  try {
    const defaults = getDefaultRunOptions();
    const mode = message.options?.mode === "development" ? "development" : defaults.mode;

    return {
      mode,
      processHiddenNodes: message.options?.processHiddenNodes === true,
      processLockedNodes: message.options?.processLockedNodes === true,
      recolorExistingAsterisks: mode === "development" && message.options?.recolorExistingAsterisks === true,
    };
  } catch (error) {
    console.error("[Чистовик] Failed to get run options from UI message", error);
    throw error;
  }
}

function getCleanResultNotificationMessage(result: TextProcessResult): string {
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
  } catch (error) {
    console.error("[Чистовик] Failed to prepare result notification", error);
    throw error;
  }
}

function getSkippedLayerLabel(result: TextProcessResult): string {
  try {
    if (result.skippedLocked > 0 && result.skippedHidden > 0) {
      return "Замочки и скрытые слои";
    }

    if (result.skippedHidden > 0) {
      return "Скрытые слои";
    }

    return "Замочки";
  } catch (error) {
    console.error("[Чистовик] Failed to get skipped layer label", error);
    throw error;
  }
}

async function collectTargetTextNodes(options: { processHidden: boolean; processLocked: boolean }): Promise<TextCollectionResult> {
  try {
    const selection = figma.currentPage.selection;
    let candidates: TextNode[] = [];

    if (selection.length === 0) {
      await withFigmaOperationTimeout(() => figma.currentPage.loadAsync(), "current_page_load");
      candidates = figma.currentPage.findAllWithCriteria({ types: ["TEXT"] });
    } else {
      const seen = new Set<string>();

      for (const selectedNode of selection) {
        collectTextNodesFromNode(selectedNode, candidates, seen);
      }
    }

    return filterProcessableTextNodes(candidates, options);
  } catch (error) {
    console.error("[Чистовик] Failed to collect text nodes", error);
    throw error;
  }
}

function collectTextNodesFromNode(node: SceneNode, result: TextNode[], seen: Set<string>): void {
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
  } catch (error) {
    console.error("[Чистовик] Failed to walk selected node", error);
    throw error;
  }
}

function filterProcessableTextNodes(textNodes: TextNode[], options: { processHidden: boolean; processLocked: boolean }): TextCollectionResult {
  try {
    const nodes: TextNode[] = [];
    let skippedHidden = 0;
    let skippedLocked = 0;
    const hiddenStateCache = new Map<string, boolean>();
    const lockedStateCache = new Map<string, boolean>();

    for (const textNode of textNodes) {
      if (!options.processLocked && isLockedForProcessing(textNode, lockedStateCache)) {
        skippedLocked += 1;
      } else if (!options.processHidden && isHiddenForProcessing(textNode, hiddenStateCache)) {
        skippedHidden += 1;
      } else {
        nodes.push(textNode);
      }
    }

    return { nodes, skippedHidden, skippedLocked };
  } catch (error) {
    console.error("[Чистовик] Failed to filter processable text nodes", error);
    throw error;
  }
}

function isLockedForProcessing(node: BaseNode, cache: Map<string, boolean> = new Map<string, boolean>()): boolean {
  try {
    const visited: BaseNode[] = [];
    let current: BaseNode | null = node;
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
  } catch (error) {
    console.error("[Чистовик] Failed to check locked node state", error);
    throw error;
  }
}

function isHiddenForProcessing(node: BaseNode, cache: Map<string, boolean> = new Map<string, boolean>()): boolean {
  try {
    const visited: BaseNode[] = [];
    let current: BaseNode | null = node;
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
  } catch (error) {
    console.error("[Чистовик] Failed to check hidden node state", error);
    throw error;
  }
}

function hasVisibleProperty(node: BaseNode): node is BaseNode & { visible: boolean } {
  try {
    return "visible" in node && typeof node.visible === "boolean";
  } catch (error) {
    console.error("[Чистовик] Failed to check visible property", error);
    throw error;
  }
}

function hasLockedProperty(node: BaseNode): node is BaseNode & { locked: boolean } {
  try {
    return "locked" in node && typeof node.locked === "boolean";
  } catch (error) {
    console.error("[Чистовик] Failed to check locked property", error);
    throw error;
  }
}

function isSupportedNumberContextParent(parent: BaseNode | null): parent is BaseNode & ChildrenMixin & AutoLayoutMixin {
  try {
    return (
      parent !== null &&
      "children" in parent &&
      "layoutMode" in parent &&
      parent.layoutMode === "HORIZONTAL" &&
      "layoutWrap" in parent &&
      parent.layoutWrap === "NO_WRAP"
    );
  } catch {
    return false;
  }
}

function isSupportedNumberContextTextNode(node: TextNode): boolean {
  try {
    return (
      !isTextNodeRemoved(node) &&
      node.textAutoResize === "WIDTH_AND_HEIGHT" &&
      node.maxLines === null &&
      !/[\n\r]/.test(node.characters) &&
      node.layoutPositioning === "AUTO" &&
      node.rotation === 0
    );
  } catch {
    return false;
  }
}

function isPureNumberContextCandidate(input: string): boolean {
  try {
    const trimmed = input.trim();

    return /(\d{4}|\d+\.\d+)/.test(trimmed) && /^[+−\-()\d.,'’ʼ \t\u00A0\u2009\u202F—–:;]+$/.test(trimmed);
  } catch (error) {
    console.error("[Чистовик] Failed to check number context candidate", error);
    throw error;
  }
}

function isExactProtectiveContextLabel(input: string): boolean {
  try {
    const normalized = input.trim().replace(/:$/, "").trim().toLowerCase();
    return QUANTITY_PROTECTIVE_LABELS.some((label) => label.toLowerCase() === normalized);
  } catch (error) {
    console.error("[Чистовик] Failed to check protective context label", error);
    throw error;
  }
}

function getExactContextMarker(input: string): QuantityEvidence | null {
  try {
    const normalized = normalizeQuantityMarkerForLookup(input.replace(/:$/, "").trim());
    const kind = getQuantityMarkerKind(normalized);
    return kind === null ? null : { kind, marker: normalized };
  } catch (error) {
    console.error("[Чистовик] Failed to classify context marker", error);
    throw error;
  }
}

function isAllowedNumberContextSeparator(input: string): boolean {
  try {
    return /^(?::|—|–)$/.test(input.trim());
  } catch (error) {
    console.error("[Чистовик] Failed to check number context separator", error);
    throw error;
  }
}

function getContextNodeState(node: SceneNode, hiddenCache: Map<string, boolean>, lockedCache: Map<string, boolean>): unknown {
  try {
    const textNode = node.type === "TEXT" ? node : null;
    return {
      id: node.id,
      type: node.type,
      hidden: isHiddenForProcessing(node, hiddenCache),
      locked: isLockedForProcessing(node, lockedCache),
      layoutPositioning: "layoutPositioning" in node ? node.layoutPositioning : null,
      rotation: "rotation" in node ? node.rotation : null,
      textAutoResize: textNode?.textAutoResize ?? null,
      textTruncation: textNode !== null && "textTruncation" in textNode ? textNode.textTruncation : null,
      maxLines: textNode !== null && "maxLines" in textNode ? textNode.maxLines : null,
      minWidth: "minWidth" in node ? node.minWidth : null,
      maxWidth: "maxWidth" in node ? node.maxWidth : null,
      layoutSizingHorizontal: "layoutSizingHorizontal" in node ? node.layoutSizingHorizontal : null,
    };
  } catch (error) {
    console.error("[Чистовик] Failed to read number context node state", error);
    throw error;
  }
}

function getNumberContextParentSnapshotKey(parent: BaseNode & ChildrenMixin & AutoLayoutMixin): string {
  try {
    const hiddenCache = new Map<string, boolean>();
    const lockedCache = new Map<string, boolean>();
    return JSON.stringify({
      id: parent.id,
      layoutMode: parent.layoutMode,
      layoutWrap: parent.layoutWrap,
      children: parent.children.map((child) => getContextNodeState(child, hiddenCache, lockedCache)),
    });
  } catch (error) {
    console.error("[Чистовик] Failed to capture number context parent", error);
    throw error;
  }
}

function getVisibleNumberContextChildren(parent: BaseNode & ChildrenMixin & AutoLayoutMixin): SceneNode[] {
  try {
    const hiddenCache = new Map<string, boolean>();
    return parent.children.filter((child) => !isHiddenForProcessing(child, hiddenCache));
  } catch (error) {
    console.error("[Чистовик] Failed to collect visible number context children", error);
    throw error;
  }
}

function getNumberNeighborIndex(children: SceneNode[], index: number, direction: -1 | 1): number | null {
  try {
    const adjacent = index + direction;

    if (adjacent < 0 || adjacent >= children.length) {
      return null;
    }

    if (children[adjacent].type === "TEXT" && isSupportedNumberContextTextNode(children[adjacent]) && isAllowedNumberContextSeparator(children[adjacent].characters)) {
      const beyondSeparator = adjacent + direction;
      return beyondSeparator >= 0 && beyondSeparator < children.length ? beyondSeparator : null;
    }

    return adjacent;
  } catch (error) {
    console.error("[Чистовик] Failed to find number context neighbor", error);
    throw error;
  }
}

function markerHasUniqueNumberNeighbor(children: SceneNode[], markerIndex: number): boolean {
  try {
    let candidateCount = 0;

    for (const direction of [-1, 1] as const) {
      const neighborIndex = getNumberNeighborIndex(children, markerIndex, direction);

      if (
        neighborIndex !== null &&
        children[neighborIndex].type === "TEXT" &&
        isSupportedNumberContextTextNode(children[neighborIndex]) &&
        isPureNumberContextCandidate(children[neighborIndex].characters)
      ) {
        candidateCount += 1;
      }
    }

    return candidateCount === 1;
  } catch (error) {
    console.error("[Чистовик] Failed to check unique marker neighbor", error);
    throw error;
  }
}

function createDiagnosticNumberContextNeighbors(
  children: SceneNode[],
  index: number,
  usedIndex: number | null = null
): NumberDiagnosticNeighbor[] {
  try {
    const neighbors: NumberDiagnosticNeighbor[] = [];

    for (const direction of [-1, 1] as const) {
      let inspectedCount = 0;

      for (
        let neighborIndex = index + direction;
        neighborIndex >= 0 && neighborIndex < children.length && inspectedCount < 4;
        neighborIndex += direction
      ) {
        inspectedCount += 1;
        const neighbor = children[neighborIndex];

        if (neighbor.type !== "TEXT" || !isSupportedNumberContextTextNode(neighbor)) {
          continue;
        }

        const text = neighbor.characters;
        const usedAsEvidence = neighborIndex === usedIndex;
        let role: NumberDiagnosticNeighborRole = "context";

        if (isAllowedNumberContextSeparator(text)) {
          role = "separator";
        } else if (isExactProtectiveContextLabel(text)) {
          role = "protection";
        } else if (getExactContextMarker(text) !== null || usedAsEvidence) {
          role = "evidence";
        }

        neighbors.push({
          direction: direction === -1 ? "left" : "right",
          role,
          text,
          usedAsEvidence,
        });

        if (!isAllowedNumberContextSeparator(text)) {
          break;
        }
      }
    }

    return neighbors.slice(0, 4);
  } catch (error) {
    console.error("[Чистовик] Failed to build diagnostic number neighbors", error);
    return [];
  }
}

function buildNumberLayerContextForNode(
  textNode: TextNode,
  parentSnapshotCache: Map<string, string> | null = null,
  visibleChildrenCache: Map<string, SceneNode[]> | null = null,
  childIndexCache: Map<string, Map<string, number>> | null = null
): NumberLayerContext | null {
  try {
    const parent = textNode.parent;

    if (!isSupportedNumberContextParent(parent) || !isSupportedNumberContextTextNode(textNode)) {
      return null;
    }

    let children = visibleChildrenCache?.get(parent.id);

    if (children === undefined) {
      children = getVisibleNumberContextChildren(parent);
      visibleChildrenCache?.set(parent.id, children);
    }

    let indexes = childIndexCache?.get(parent.id);

    if (indexes === undefined) {
      indexes = new Map(children.map((child, childIndex) => [child.id, childIndex]));
      childIndexCache?.set(parent.id, indexes);
    }

    const index = indexes.get(textNode.id) ?? -1;

    if (index === -1) {
      return null;
    }

    let parentSnapshotKey = parentSnapshotCache?.get(parent.id);

    if (parentSnapshotKey === undefined) {
      parentSnapshotKey = getNumberContextParentSnapshotKey(parent);
      parentSnapshotCache?.set(parent.id, parentSnapshotKey);
    }

    const localParticipants = children.slice(Math.max(0, index - 2), Math.min(children.length, index + 3)).map((child) => {
      if (child.type !== "TEXT") {
        return { id: child.id, text: `<${child.type}>` };
      }

      const text = child.characters;

      if (child.id === textNode.id || getExactContextMarker(text) !== null || isExactProtectiveContextLabel(text) || isAllowedNumberContextSeparator(text)) {
        return { id: child.id, text };
      }

      return { id: child.id, text: isPureNumberContextCandidate(text) ? "<number>" : text };
    });
    const snapshotKey = JSON.stringify({ localParticipants, parent: parentSnapshotKey });
    const context: NumberLayerContext = {
      diagnosticNeighbors: createDiagnosticNumberContextNeighbors(children, index),
      evidenceAfter: null,
      evidenceBefore: null,
      protectedAsPhoneByNeighbor: false,
      protectedByNeighbor: false,
      standalonePhonePrefix: false,
      snapshotKey,
    };
    const trimmedText = textNode.characters.trim();
    const rightIndex = getNumberNeighborIndex(children, index, 1);

    if (
      isStandaloneRussianPhoneCountryPrefix(trimmedText) &&
      rightIndex !== null &&
      children[rightIndex].type === "TEXT" &&
      isSupportedNumberContextTextNode(children[rightIndex]) &&
      isRussianPhoneTailToken(children[rightIndex].characters)
    ) {
      context.standalonePhonePrefix = true;
      context.diagnosticNeighbors = createDiagnosticNumberContextNeighbors(children, index, rightIndex);
      return context;
    }

    if (!isPureNumberContextCandidate(trimmedText)) {
      return context;
    }

    const candidates: Array<{ direction: -1 | 1; index: number; evidence: QuantityEvidence | null; protected: boolean }> = [];

    for (const direction of [-1, 1] as const) {
      const neighborIndex = getNumberNeighborIndex(children, index, direction);

      if (neighborIndex === null) {
        continue;
      }

      const neighbor = children[neighborIndex];

      if (neighbor.type !== "TEXT" || !isSupportedNumberContextTextNode(neighbor)) {
        continue;
      }

      const neighborText = neighbor.characters;
      const evidence = getExactContextMarker(neighborText);
      const protectedLabel = direction === -1 && isExactProtectiveContextLabel(neighborText);

      if (protectedLabel || evidence !== null) {
        candidates.push({ direction, index: neighborIndex, evidence, protected: protectedLabel });
      }
    }

    const validCandidates = candidates.filter((candidate) => candidate.protected || markerHasUniqueNumberNeighbor(children, candidate.index));

    if (validCandidates.length !== 1) {
      return context;
    }

    const candidate = validCandidates[0];

    if (candidate.protected) {
      const protectiveNode = children[candidate.index];
      context.protectedAsPhoneByNeighbor =
        protectiveNode.type === "TEXT" &&
        protectiveNode.characters.trim().replace(/:$/, "").trim().toLowerCase() === "телефон";
      context.protectedByNeighbor = true;
      context.diagnosticNeighbors = createDiagnosticNumberContextNeighbors(children, index, candidate.index);
      return context;
    }

    if (candidate.evidence === null) {
      return context;
    }

    if (candidate.direction === -1) {
      const normalizedMarker = normalizeQuantityMarkerForLookup(candidate.evidence.marker);

      if (candidate.evidence.kind !== "currency" && normalizedMarker.length === 1) {
        return context;
      }

      context.evidenceBefore = candidate.evidence;
    } else {
      context.evidenceAfter = candidate.evidence;
    }

    context.diagnosticNeighbors = createDiagnosticNumberContextNeighbors(children, index, candidate.index);

    return context;
  } catch (error) {
    console.error("[Чистовик] Failed to build number layer context", error);
    return null;
  }
}

function buildNumberLayerContexts(textNodes: TextNode[]): Map<string, NumberLayerContext> {
  try {
    const contexts = new Map<string, NumberLayerContext>();
    const parentSnapshotCache = new Map<string, string>();
    const visibleChildrenCache = new Map<string, SceneNode[]>();
    const childIndexCache = new Map<string, Map<string, number>>();

    for (const textNode of textNodes) {
      try {
        if (isTextNodeRemoved(textNode) || !/\d{4}|\d+\.\d+|^\s*\+\s*7\s*$/.test(textNode.characters)) {
          continue;
        }

        const context = buildNumberLayerContextForNode(textNode, parentSnapshotCache, visibleChildrenCache, childIndexCache);

        if (context !== null) {
          contexts.set(textNode.id, context);
        }
      } catch (error) {
        if (!isTextNodeRemoved(textNode)) {
          throw error;
        }
      }
    }

    return contexts;
  } catch (error) {
    console.error("[Чистовик] Failed to build number layer contexts", error);
    throw error;
  }
}

function getNumberDiagnosticAncestorIds(textNode: TextNode): string[] {
  try {
    const ids: string[] = [];
    let parent: BaseNode | null | undefined = textNode.parent;

    while (parent != null && ids.length < 8) {
      if (parent.type === "PAGE" || parent.type === "DOCUMENT") {
        break;
      }

      ids.push(parent.id);
      parent = parent.parent;
    }

    return ids;
  } catch (error) {
    console.error("[Чистовик] Failed to collect diagnostic number ancestors", error);
    return [];
  }
}

function isPotentialNumberDiagnosticContextLabel(input: string): boolean {
  try {
    const label = input.trim().replace(/:$/, "").trim();

    return (
      isExactProtectiveContextLabel(label) ||
      /сч[её]т|карт/i.test(label) ||
      new RegExp(`(^|[^${LETTERS}])(?:id|ид|код)(?=$|[^${LETTERS}])`, "i").test(label)
    );
  } catch {
    return false;
  }
}

function isPotentialNumberDiagnosticContextText(input: string): boolean {
  try {
    const text = input.trim();

    return (
      text.length > 0 &&
      (
        isPotentialNumberDiagnosticContextLabel(text) ||
        getExactContextMarker(text) !== null ||
        new RegExp(`[${LETTERS}]{4,}`).test(text)
      )
    );
  } catch {
    return false;
  }
}

function getNumberDiagnosticLayoutInfos(textNodes: TextNode[]): NumberDiagnosticLayoutInfo[] {
  try {
    const result: NumberDiagnosticLayoutInfo[] = [];

    for (const textNode of textNodes) {
      try {
        const text = textNode.characters;

        if (isTextNodeRemoved(textNode) || isWhitespaceOnlyText(text) || (!/\d/.test(text) && !isPotentialNumberDiagnosticContextText(text))) {
          continue;
        }

        const box = textNode.absoluteBoundingBox;

        if (box === null) {
          continue;
        }

        result.push({
          ancestorIds: getNumberDiagnosticAncestorIds(textNode),
          box,
          containerId: textNode.parent?.id ?? null,
          id: textNode.id,
          text,
        });
      } catch (error) {
        if (!isTextNodeRemoved(textNode)) {
          throw error;
        }
      }
    }

    return result.sort((first, second) => getRectCenterY(first.box) - getRectCenterY(second.box));
  } catch (error) {
    console.error("[Чистовик] Failed to collect diagnostic number layout", error);
    return [];
  }
}

function getNumberDiagnosticCommonAncestorDistance(
  first: NumberDiagnosticLayoutInfo,
  second: NumberDiagnosticLayoutInfo
): number | null {
  try {
    const secondIndexes = new Map(second.ancestorIds.map((id, index) => [id, index]));
    let minimum: number | null = null;

    first.ancestorIds.forEach((id, firstIndex) => {
      const secondIndex = secondIndexes.get(id);

      if (secondIndex !== undefined) {
        const distance = firstIndex + secondIndex;
        minimum = minimum === null ? distance : Math.min(minimum, distance);
      }
    });

    return minimum;
  } catch {
    return null;
  }
}

function isNumberDiagnosticSameVisualRow(first: Rect, second: Rect): boolean {
  try {
    const centerDistance = Math.abs(getRectCenterY(first) - getRectCenterY(second));
    return centerDistance <= Math.max(4, Math.min(first.height, second.height) / 2);
  } catch {
    return false;
  }
}

function getNumberDiagnosticHorizontalRelation(
  target: Rect,
  candidate: Rect
): { direction: "left" | "right"; gap: number } | null {
  try {
    const targetRight = target.x + target.width;
    const candidateRight = candidate.x + candidate.width;

    if (candidateRight <= target.x + 4) {
      return { direction: "left", gap: Math.max(0, target.x - candidateRight) };
    }

    if (candidate.x >= targetRight - 4) {
      return { direction: "right", gap: Math.max(0, candidate.x - targetRight) };
    }

    return null;
  } catch {
    return null;
  }
}

function getSpatialIdentifierContextRole(
  targetText: string,
  neighborText: string
): NumberDiagnosticNeighborRole | null {
  try {
    const target = normalizeHorizontalSpaces(targetText).trim();
    const neighbor = neighborText.trim().replace(/:$/, "").trim();
    const normalizedNeighbor = neighbor.toLowerCase();

    if (isExactProtectiveContextLabel(neighbor)) {
      return "protection";
    }

    if (isPaymentAccountNumberToken(target) && /сч[её]т/.test(normalizedNeighbor)) {
      return "context";
    }

    if (
      (isPaymentCardNumberToken(target) || isCardMaskToken(target)) &&
      /карт/.test(normalizedNeighbor)
    ) {
      return "context";
    }

    const hasLettersAndDigits = new RegExp(`[${LETTERS}]`).test(target) && /\d/.test(target);
    const codeLabel = new RegExp(`(^|[^${LETTERS}])(?:id|ид|код)(?=$|[^${LETTERS}])`, "i").test(neighbor);

    if (hasLettersAndDigits && codeLabel) {
      return "context";
    }

    if (getExactContextMarker(neighborText) !== null || new RegExp(`[${LETTERS}]{4,}`).test(neighbor)) {
      return "context";
    }

    return null;
  } catch (error) {
    console.error("[Чистовик] Failed to classify spatial diagnostic context", error);
    return null;
  }
}

function findSpatialIdentifierDiagnosticNeighbors(
  target: NumberDiagnosticLayoutInfo,
  layoutInfos: NumberDiagnosticLayoutInfo[]
): NumberDiagnosticNeighbor[] {
  try {
    const maximumCenterDistance = Math.max(12, target.box.height);
    const targetCenterY = getRectCenterY(target.box);
    let low = 0;
    let high = layoutInfos.length;

    while (low < high) {
      const middle = Math.floor((low + high) / 2);

      if (getRectCenterY(layoutInfos[middle].box) < targetCenterY - maximumCenterDistance) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }

    const nearest = new Map<"left" | "right", { neighbor: NumberDiagnosticNeighbor; score: number }>();

    for (let index = low; index < layoutInfos.length; index += 1) {
      const candidate = layoutInfos[index];

      if (getRectCenterY(candidate.box) > targetCenterY + maximumCenterDistance) {
        break;
      }

      if (candidate.id === target.id || !isNumberDiagnosticSameVisualRow(target.box, candidate.box)) {
        continue;
      }

      const relation = getNumberDiagnosticHorizontalRelation(target.box, candidate.box);
      const ancestorDistance = getNumberDiagnosticCommonAncestorDistance(target, candidate);
      const role = getSpatialIdentifierContextRole(target.text, candidate.text);

      if (relation === null || relation.gap > 720 || ancestorDistance === null || ancestorDistance > 8 || role === null) {
        continue;
      }

      const score = ancestorDistance * 1000 + relation.gap;
      const current = nearest.get(relation.direction);

      if (current === undefined || score < current.score) {
        nearest.set(relation.direction, {
          neighbor: {
            direction: relation.direction,
            role,
            text: candidate.text,
            usedAsEvidence:
              role === "protection" || isPotentialNumberDiagnosticContextLabel(candidate.text),
          },
          score,
        });
      }
    }

    return (["left", "right"] as const)
      .map((direction) => nearest.get(direction)?.neighbor ?? null)
      .filter((neighbor): neighbor is NumberDiagnosticNeighbor => neighbor !== null);
  } catch (error) {
    console.error("[Чистовик] Failed to find spatial diagnostic number neighbors", error);
    return [];
  }
}

function buildNumberDiagnosticLayerContexts(textNodes: TextNode[]): Map<string, NumberLayerContext> {
  try {
    const contexts = new Map<string, NumberLayerContext>();
    const needsSpatialDiagnosticContext = textNodes.some((textNode) => {
      try {
        return !isTextNodeRemoved(textNode) && isStandaloneNumberDiagnosticLayer(textNode.characters);
      } catch {
        return false;
      }
    });
    const layoutInfos = needsSpatialDiagnosticContext ? getNumberDiagnosticLayoutInfos(textNodes) : [];
    const layoutInfoById = new Map(layoutInfos.map((info) => [info.id, info]));
    const parentSnapshotCache = new Map<string, string>();
    const visibleChildrenCache = new Map<string, SceneNode[]>();
    const childIndexCache = new Map<string, Map<string, number>>();

    for (const textNode of textNodes) {
      try {
        if (isTextNodeRemoved(textNode) || !/\d/.test(textNode.characters)) {
          continue;
        }

        let context = buildNumberLayerContextForNode(textNode, parentSnapshotCache, visibleChildrenCache, childIndexCache);

        if (context !== null && !context.protectedByNeighbor && isStandaloneNumberDiagnosticLayer(textNode.characters)) {
          const protectiveNeighbors = context.diagnosticNeighbors.filter(
            (neighbor) => neighbor.role === "protection" && isExactProtectiveContextLabel(neighbor.text)
          );

          if (protectiveNeighbors.length === 1) {
            const protectiveText = protectiveNeighbors[0].text.trim().replace(/:$/, "").trim().toLowerCase();
            context = {
              ...context,
              diagnosticNeighbors: context.diagnosticNeighbors.map((neighbor) =>
                neighbor === protectiveNeighbors[0] ? { ...neighbor, usedAsEvidence: true } : neighbor
              ),
              protectedAsPhoneByNeighbor: protectiveText === "телефон",
              protectedByNeighbor: true,
            };
          }
        }

        if (isStandaloneNumberDiagnosticLayer(textNode.characters)) {
          const targetLayout = layoutInfoById.get(textNode.id);
          const hasUsedNeighbor = context?.diagnosticNeighbors.some((neighbor) => neighbor.usedAsEvidence) === true;

          if (targetLayout !== undefined && !hasUsedNeighbor) {
            const spatialNeighbors = findSpatialIdentifierDiagnosticNeighbors(targetLayout, layoutInfos);

            if (spatialNeighbors.length > 0) {
              const protectedNeighbor = spatialNeighbors.find((neighbor) => neighbor.role === "protection");
              const diagnosticNeighbors = [
                ...(context?.diagnosticNeighbors ?? []).filter(
                  (neighbor) => !spatialNeighbors.some(
                    (spatial) => spatial.direction === neighbor.direction && spatial.text === neighbor.text
                  )
                ),
                ...spatialNeighbors,
              ];
              context = {
                diagnosticNeighbors,
                evidenceAfter: context?.evidenceAfter ?? null,
                evidenceBefore: context?.evidenceBefore ?? null,
                protectedAsPhoneByNeighbor:
                  context?.protectedAsPhoneByNeighbor === true ||
                  protectedNeighbor?.text.trim().replace(/:$/, "").trim().toLowerCase() === "телефон",
                protectedByNeighbor: context?.protectedByNeighbor === true || protectedNeighbor !== undefined,
                standalonePhonePrefix: context?.standalonePhonePrefix ?? false,
                snapshotKey: context?.snapshotKey ?? `diagnostic-layout:${textNode.id}`,
              };
            }
          }
        }

        if (context !== null) {
          contexts.set(textNode.id, context);
        }
      } catch (error) {
        if (!isTextNodeRemoved(textNode)) {
          throw error;
        }
      }
    }

    return contexts;
  } catch (error) {
    console.error("[Чистовик] Failed to build diagnostic number layer contexts", error);
    return new Map<string, NumberLayerContext>();
  }
}

function assertNumberLayerContextUnchanged(
  textNode: TextNode,
  initialContext: NumberLayerContext | null,
  parentSnapshotCache: Map<string, string> | null = null,
  visibleChildrenCache: Map<string, SceneNode[]> | null = null,
  childIndexCache: Map<string, Map<string, number>> | null = null
): void {
  if (initialContext === null) {
    return;
  }

  const currentContext = buildNumberLayerContextForNode(textNode, parentSnapshotCache, visibleChildrenCache, childIndexCache);

  if (currentContext === null || currentContext.snapshotKey !== initialContext.snapshotKey) {
    const error = new Error("Number layer context changed while the typograph was preparing the write");
    error.name = TEXT_LAYER_CONTENT_CHANGED_ERROR_NAME;
    throw error;
  }
}

async function processTextNodes(
  textNodes: TextNode[],
  skippedLocked: number,
  skippedHidden: number,
  options: PluginRunOptions,
  writeStrategy: TextWriteStrategy = DEFAULT_TEXT_WRITE_STRATEGY
): Promise<TextProcessResult> {
  try {
    let processed = 0;
    let successful = 0;
    let changed = 0;
    let failed = 0;
    let failureDiagnostic: AnalyticsErrorDiagnostic | null = null;
    let failedStage: AnalyticsErrorStage | null = null;
    let originalFailureDiagnostic: AnalyticsErrorDiagnostic | null = null;
    let originalFailureStage: AnalyticsErrorStage | null = null;
    let rollbackFailureDiagnostic: TextLayerRollbackFailureDiagnostic | null = null;
    let requiresStyleWarning = false;
    let textLayerContentChanged = false;
    const timings = createEmptyTextProcessTimings();
    let charactersChangedTotal = 0;
    let charactersProcessedTotal = 0;
    let largestTextLayerCharacters = 0;
    let pointEditMaxOperationsCount = 0;
    let pointEditMismatchLayersCount = 0;
    let pointEditOperationsCount = 0;
    let pointEditPlannedLayersCount = 0;
    let rollbackAttemptedLayersCount = 0;
    let rollbackFailedLayersCount = 0;
    let slowestTextLayerMs = 0;
    let styleSegmentsCount = 0;
    let undoCheckpointCreated = false;
    let stoppedAtTextNodeIndex: number | null = null;
    const problemLayers: ProblemLayerReportItem[] = [];
    const numberDiagnostics: NumberDiagnosticCase[] = [];
    const linkedStyleAvailabilityCache = new Map<string, Promise<void>>();
    const linkedVariableAvailabilityCache = new Map<string, Promise<void>>();
    const ruleAnalyticsCollector = createTypographyRuleAnalyticsCollector();
    const fontLoadCache = new Map<string, Promise<void>>();
    const loadedFontKeys = new Set<string>();
    const fontLoadingBudget: FontLoadingBudget = {
      remainingMs: FONT_LOADING_RUN_TIMEOUT_MS,
    };
    const ensureUndoCheckpoint = (): void => {
      if (!undoCheckpointCreated) {
        figma.commitUndo();
        undoCheckpointCreated = true;
      }
    };
    const numberLayerContexts = measureDuration(
      (duration) => {
        timings.numberContext += duration;
      },
      () => buildNumberLayerContexts(textNodes)
    );
    const numberDiagnosticLayerContexts = measureDuration(
      (duration) => {
        timings.numberContext += duration;
      },
      () => buildNumberDiagnosticLayerContexts(textNodes)
    );
    const processingTextNodes = textNodes.slice();
    const deferredNumberContextNodeIds = new Set<string>();
    const finalNumberContextParentSnapshotCache = new Map<string, string>();
    const finalNumberContextVisibleChildrenCache = new Map<string, SceneNode[]>();
    const finalNumberContextChildIndexCache = new Map<string, Map<string, number>>();
    for (let textNodeIndex = 0; textNodeIndex < processingTextNodes.length; textNodeIndex += 1) {
      const textNode = processingTextNodes[textNodeIndex];
      const textLayerStartedAt = getMonotonicTimeMs();
      let currentStage: AnalyticsErrorStage = "unknown";
      let countedAsProcessed = false;
      let originalTextForRuleAnalytics: string | null = null;
      let shouldStopProcessing = false;
      let deferredForNumberContextRetry = false;
      let currentLayerWasMutated = false;
      let currentLayerCountedAsChanged = false;
      let currentLayerRecordedTextChange = false;
      let currentLayerSnapshot: TextLayerStateSnapshot | null = null;
      let currentLayerMutationJournal: PointTextMutationJournal | null = null;
      let numberLayerContext: NumberLayerContext | null = null;
      let numberDiagnosticLayerContext: NumberLayerContext | null = null;
      let currentLayerNumberDiagnostics: NumberDiagnosticCase[] = [];

      try {
        if (isTextNodeRemoved(textNode)) {
          console.warn("[Чистовик] Skipped removed text node");
          continue;
        }

        const oldText = textNode.characters;
        if (deferredNumberContextNodeIds.has(textNode.id)) {
          const parentId = textNode.parent?.id;

          if (parentId !== undefined) {
            finalNumberContextParentSnapshotCache.delete(parentId);
            finalNumberContextVisibleChildrenCache.delete(parentId);
            finalNumberContextChildIndexCache.delete(parentId);
          }

          numberLayerContext = buildNumberLayerContextForNode(textNode);
          numberDiagnosticLayerContext = numberLayerContext;
        } else {
          numberLayerContext = numberLayerContexts.get(textNode.id) ?? null;
          numberDiagnosticLayerContext = numberDiagnosticLayerContexts.get(textNode.id) ?? numberLayerContext;
        }
        const ensureCurrentLayerSnapshot = (knownStyles?: StyleSegment[]): TextLayerStateSnapshot => {
          if (currentLayerSnapshot === null) {
            currentLayerSnapshot = createTextLayerStateSnapshot(
              textNode,
              oldText,
              knownStyles ?? captureTextStyles(textNode)
            );
          }

          return currentLayerSnapshot;
        };

        if (isWhitespaceOnlyText(oldText)) {
          continue;
        }

        processed += 1;
        countedAsProcessed = true;
        originalTextForRuleAnalytics = oldText;
        beginTypographyRuleAnalyticsTextLayer(ruleAnalyticsCollector, processed - 1);
        charactersProcessedTotal += oldText.length;
        largestTextLayerCharacters = Math.max(largestTextLayerCharacters, oldText.length);

        currentStage = "development_markers";
        const existingDevelopmentMarkerIndexes = measureDuration(
          (duration) => {
            timings.developmentMarkers += duration;
          },
          () => getExistingDevelopmentMarkerIndexes(textNode)
        );
        currentStage = "clean_text";
        const cleanResult = measureDuration(
          (duration) => {
            timings.typography += duration;
          },
          () => {
            const inputText = numberLayerContext?.standalonePhonePrefix === true ? normalizeStandaloneRussianPhoneCountryPrefix(oldText) : oldText;
            return cleanTypographyWithMetadata(inputText, options, existingDevelopmentMarkerIndexes, ruleAnalyticsCollector, numberLayerContext);
          }
        );
        const newText = cleanResult.text;
        currentLayerNumberDiagnostics = createNumberDiagnosticCases(
          oldText,
          newText,
          numberDiagnosticLayerContext,
          existingDevelopmentMarkerIndexes,
          cleanResult.developmentMarkerIndexes
        );

        if (newText !== oldText) {
          const pointEditPlan = measureDuration(
            (duration) => {
              timings.pointEditPlanning += duration;
            },
            () => createPointTextEditPlan(oldText, newText)
          );
          pointEditPlannedLayersCount += 1;
          pointEditOperationsCount += pointEditPlan.operationsCount;
          pointEditMaxOperationsCount = Math.max(pointEditMaxOperationsCount, pointEditPlan.operationsCount);

          if (!pointEditPlan.matches) {
            pointEditMismatchLayersCount += 1;
            console.error(`[Чистовик] Point edit plan mismatch for text node ${textNode.id}`);

            if (writeStrategy === "point") {
              currentStage = "compare_text";
              throw new Error("Point text edit plan does not match the expected text");
            }
          }

          currentStage = "read_styles";
          let styles = measureDuration(
            (duration) => {
              timings.readStyles += duration;
            },
            () => captureTextStyles(textNode)
          );
          let textLayerPreparationStable = false;

          for (let preparationAttempt = 0; preparationAttempt < TEXT_LAYER_PREPARATION_MAX_ATTEMPTS; preparationAttempt += 1) {
            currentStage = "load_fonts";
            await measureAsyncDuration(
              (duration) => {
                timings.fonts += duration;
              },
              () => loadFontsForTextNode(textNode, fontLoadCache, loadedFontKeys, fontLoadingBudget)
            );

            assertTextNodeCharactersUnchanged(textNode, oldText);
            assertNumberLayerContextUnchanged(textNode, numberLayerContext, finalNumberContextParentSnapshotCache, finalNumberContextVisibleChildrenCache, finalNumberContextChildIndexCache);
            currentStage = "read_styles";
            const stylesAfterFontLoading = measureDuration(
              (duration) => {
                timings.readStyles += duration;
              },
              () => captureTextStyles(textNode)
            );

            if (!areTextStyleSegmentsEqual(styles, stylesAfterFontLoading)) {
              styles = stylesAfterFontLoading;
              continue;
            }

            if (writeStrategy === "full") {
              currentStage = "restore_styles";
              await measureAsyncDuration(
                (duration) => {
                  timings.readStyles += duration;
                },
                () => assertLinkedResourcesAvailable(styles, linkedStyleAvailabilityCache, linkedVariableAvailabilityCache)
              );

              assertTextNodeCharactersUnchanged(textNode, oldText);
              currentStage = "read_styles";
              const stylesAfterLinkedStyleLoading = measureDuration(
                (duration) => {
                  timings.readStyles += duration;
                },
                () => captureTextStyles(textNode)
              );

              if (!areTextStyleSegmentsEqual(styles, stylesAfterLinkedStyleLoading)) {
                styles = stylesAfterLinkedStyleLoading;
                continue;
              }

              styles = stylesAfterLinkedStyleLoading;
            }

            textLayerPreparationStable = true;
            break;
          }

          if (!textLayerPreparationStable) {
            const error = new Error("Text layer styles kept changing while the typograph was preparing the write");
            error.name = "TextLayerStylesChangedError";
            throw error;
          }

          if (writeStrategy === "full") {
            currentStage = "compare_text";
            const styleComparison = measureDuration(
              (duration) => {
                timings.compareText += duration;
              },
              () => createStyleRestorationPlan(oldText, newText, styles)
            );

            currentStage = "write_text";
            assertTextNodeCharactersUnchanged(textNode, oldText);
            assertNumberLayerContextUnchanged(textNode, numberLayerContext, finalNumberContextParentSnapshotCache, finalNumberContextVisibleChildrenCache, finalNumberContextChildIndexCache);
            ensureCurrentLayerSnapshot(styles);
            ensureUndoCheckpoint();
            currentLayerWasMutated = true;
            currentLayerMutationJournal = createPointTextMutationJournal(oldText);
            measureDuration(
              (duration) => {
                timings.writeText += duration;
              },
              () => {
                textNode.characters = newText;
                (currentLayerMutationJournal as PointTextMutationJournal).expectedText = textNode.characters;
              }
            );
            currentStage = "restore_styles";
            const { styleMap, verifyUniformLinkedStyle, wholeTextStyle } = styleComparison;
            if (wholeTextStyle !== null) {
              await measureAsyncDuration(
                (duration) => {
                  timings.restoreStyles += duration;
                },
                () => restoreWholeTextStyle(textNode, wholeTextStyle, verifyUniformLinkedStyle)
              );
            } else {
              await measureAsyncDuration(
                (duration) => {
                  timings.restoreStyles += duration;
                },
                () => restoreTextStyles(textNode, styleMap, styles, verifyUniformLinkedStyle)
              );

              if (!verifyTextStyleRestorationPlan(textNode, styleMap, styles)) {
                throw new Error("Text style verification failed");
              }
            }

            if (verifyUniformLinkedStyle && !verifyUniformStylePreservation(textNode, styles[0])) {
              throw new Error("Linked style verification failed");
            }
          } else {
            currentStage = "compare_text";
            const pointEdits = coalesceDensePointTextEdits(oldText, pointEditPlan.edits, styles);
            const pointStyleMap = measureDuration(
              (duration) => {
                timings.compareText += duration;
              },
              () => {
                assertPointTextEditsSafeForCurrentStage(oldText, pointEdits, styles);
                return buildPointTextEditStyleMap(oldText, styles, pointEdits);
              }
            );

            currentStage = "write_text";
            assertTextNodeCharactersUnchanged(textNode, oldText);
            assertNumberLayerContextUnchanged(textNode, numberLayerContext, finalNumberContextParentSnapshotCache, finalNumberContextVisibleChildrenCache, finalNumberContextChildIndexCache);
            ensureCurrentLayerSnapshot(styles);
            ensureUndoCheckpoint();
            currentLayerWasMutated = true;
            currentLayerMutationJournal = createPointTextMutationJournal(oldText);
            measureDuration(
              (duration) => {
                timings.writeText += duration;
              },
              () => applyPointTextEditsToTextNode(textNode, pointEdits, currentLayerMutationJournal as PointTextMutationJournal)
            );

            if (textNode.characters !== newText) {
              throw new Error("Point text write did not produce the expected text");
            }

            currentStage = "restore_styles";
            const stylesPreserved = measureDuration(
              (duration) => {
                timings.restoreStyles += duration;
              },
              () => verifyTextStyleRestorationPlan(textNode, pointStyleMap, styles)
            );

            if (!stylesPreserved) {
              throw new Error("Point text write did not preserve text styles");
            }
          }

          charactersChangedTotal += oldText.length;
          styleSegmentsCount += styles.length;
          currentLayerRecordedTextChange = true;
          currentStage = "development_markers";
          measureDuration(
            (duration) => {
              timings.developmentMarkers += duration;
            },
            () => applyDevelopmentMarkerStyles(textNode, cleanResult.developmentMarkerIndexes)
          );
          changed += 1;
          currentLayerCountedAsChanged = true;
        } else {
          currentStage = "development_markers";
          if (needsDevelopmentMarkerStyles(textNode, cleanResult.developmentMarkerIndexes)) {
            ensureCurrentLayerSnapshot();
            ensureUndoCheckpoint();
            currentLayerWasMutated = true;
            measureDuration(
              (duration) => {
                timings.developmentMarkers += duration;
              },
              () => {
                applyDevelopmentMarkerStyles(textNode, cleanResult.developmentMarkerIndexes);
              }
            );
          }
        }

        currentStage = "development_markers";
        if (needsDevelopmentMarkerPluginDataSync(textNode, options, cleanResult.developmentMarkerIndexes)) {
          ensureCurrentLayerSnapshot();
          ensureUndoCheckpoint();
          currentLayerWasMutated = true;
          measureDuration(
            (duration) => {
              timings.developmentMarkers += duration;
            },
            () => syncDevelopmentMarkerPluginData(textNode, options, cleanResult.developmentMarkerIndexes)
          );
        }

        if (currentLayerSnapshot !== null && !verifyPreservedTextLayerConnections(currentLayerSnapshot)) {
          currentStage = "restore_styles";
          throw new Error("Text layer component connection verification failed");
        }

        successful += 1;
        numberDiagnostics.push(...currentLayerNumberDiagnostics);
      } catch (error) {
        let caughtError = error;
        let rollbackFailed = false;
        const failureStageBeforeRollback = currentStage;
        const diagnosticBeforeRollback = createAnalyticsErrorDiagnostic(error, failureStageBeforeRollback);
        let rollbackResult: TextLayerRollbackResult | null = null;

        if (currentLayerWasMutated && currentLayerSnapshot !== null) {
          const snapshotToRestore = currentLayerSnapshot as TextLayerStateSnapshot;
          rollbackAttemptedLayersCount += 1;
          rollbackResult = await measureAsyncDuration(
            (duration) => {
              timings.restoreStyles += duration;
            },
            () => restoreTextLayerSnapshot(snapshotToRestore, currentLayerMutationJournal)
          );

          if (currentLayerCountedAsChanged) {
            changed = Math.max(0, changed - 1);
          }

          if (currentLayerRecordedTextChange) {
            charactersChangedTotal = Math.max(0, charactersChangedTotal - snapshotToRestore.text.length);
            styleSegmentsCount = Math.max(0, styleSegmentsCount - snapshotToRestore.styles.length);
          }

          if (!rollbackResult.succeeded) {
            rollbackFailedLayersCount += 1;
            requiresStyleWarning = true;
            rollbackFailed = true;
            currentStage = "rollback_styles";
            caughtError = new Error("Failed to restore original text layer state");
            shouldStopProcessing = true;
          } else {
            currentStage = failureStageBeforeRollback;
          }
        }

        const diagnostic = rollbackFailed
          ? createAnalyticsErrorDiagnostic(caughtError, "rollback_styles")
          : diagnosticBeforeRollback;
        const safelySkippedMissingTextNode = !currentLayerWasMutated && isTextNodeRemoved(textNode);
        let currentTextStillMatches = false;

        try {
          currentTextStillMatches = originalTextForRuleAnalytics !== null && textNode.characters === originalTextForRuleAnalytics;
        } catch {
          currentTextStillMatches = false;
        }

        if (
          !rollbackFailed &&
          !currentLayerWasMutated &&
          numberLayerContext !== null &&
          diagnostic.name === TEXT_LAYER_CONTENT_CHANGED_ERROR_NAME &&
          currentTextStillMatches &&
          !deferredNumberContextNodeIds.has(textNode.id)
        ) {
          deferredNumberContextNodeIds.add(textNode.id);
          processingTextNodes.push(textNode);
          deferredForNumberContextRetry = true;

          if (countedAsProcessed) {
            processed = Math.max(0, processed - 1);
            charactersProcessedTotal = Math.max(0, charactersProcessedTotal - (originalTextForRuleAnalytics?.length ?? 0));
            finishTypographyRuleAnalyticsTextLayer(ruleAnalyticsCollector, false);
            countedAsProcessed = false;
          }

        } else if (safelySkippedMissingTextNode) {
          if (countedAsProcessed) {
            processed = Math.max(0, processed - 1);
            charactersProcessedTotal = Math.max(0, charactersProcessedTotal - (originalTextForRuleAnalytics?.length ?? 0));
          }

          console.warn("[Чистовик] Skipped missing text node");
        } else if (rollbackFailed) {
          failed += 1;
          failedStage = "rollback_styles";
          failureDiagnostic = diagnostic;
          originalFailureDiagnostic = diagnosticBeforeRollback;
          originalFailureStage = failureStageBeforeRollback;
          rollbackFailureDiagnostic = rollbackResult?.failureDiagnostic ?? null;
          problemLayers.push(
            createProblemLayerReportItem(
              textNode,
              "critical_integrity",
              (currentLayerSnapshot as TextLayerStateSnapshot | null)?.text ?? originalTextForRuleAnalytics ?? ""
            )
          );
        } else {
          failed += 1;
          problemLayers.push(
            createProblemLayerReportItem(
              textNode,
              "safe_failure",
              (currentLayerSnapshot as TextLayerStateSnapshot | null)?.text ?? originalTextForRuleAnalytics ?? ""
            )
          );

          if (diagnostic.name === TEXT_LAYER_CONTENT_CHANGED_ERROR_NAME) {
            textLayerContentChanged = true;
          }

          failedStage ??= currentStage;
          failureDiagnostic ??= diagnostic;
        }

        if (!safelySkippedMissingTextNode && !deferredForNumberContextRetry) {
          console.error(`[Чистовик] Failed to process text node ${textNode.id}`, caughtError);
        }
      } finally {
        if (countedAsProcessed) {
          let finalTextChanged = false;

          try {
            finalTextChanged = originalTextForRuleAnalytics !== null && textNode.characters !== originalTextForRuleAnalytics;
          } catch {
            // If Figma no longer allows reading the layer, rule changes cannot be confirmed.
          }

          finishTypographyRuleAnalyticsTextLayer(ruleAnalyticsCollector, finalTextChanged);
          slowestTextLayerMs = Math.max(slowestTextLayerMs, Math.max(0, getMonotonicTimeMs() - textLayerStartedAt));
        }
      }

      if (shouldStopProcessing) {
        stoppedAtTextNodeIndex = textNodeIndex;
        break;
      }
    }

    if (stoppedAtTextNodeIndex !== null) {
      for (let textNodeIndex = stoppedAtTextNodeIndex + 1; textNodeIndex < textNodes.length; textNodeIndex += 1) {
        const textNode = textNodes[textNodeIndex];

        try {
          if (isTextNodeRemoved(textNode) || isWhitespaceOnlyText(textNode.characters)) {
            continue;
          }

          problemLayers.push(createProblemLayerReportItem(textNode, "not_reached", textNode.characters));
        } catch {
          // A layer removed while the report is being prepared no longer needs user action.
        }
      }
    }

    return {
      processed,
      successful,
      changed,
      failed,
      failureDiagnostic,
      failedStage,
      originalFailureDiagnostic,
      originalFailureStage,
      rollbackFailureDiagnostic,
      requiresStyleWarning,
      textLayerContentChanged,
      skippedHidden,
      skippedLocked,
      problemLayers,
      numberDiagnostics,
      analytics: {
        charactersChangedTotal,
        charactersProcessedTotal,
        largestTextLayerCharacters,
        pointEditMaxOperationsCount,
        pointEditMismatchLayersCount,
        pointEditOperationsCount,
        pointEditPlannedLayersCount,
        rollbackAttemptedLayersCount,
        rollbackFailedLayersCount,
        slowestTextLayerMs,
        styleSegmentsCount,
        timings,
        uniqueFontsCount: loadedFontKeys.size,
        ruleAnalytics: createTypographyRuleAnalyticsSummary(ruleAnalyticsCollector),
      },
    };
  } catch (error) {
    console.error("[Чистовик] Failed to process text nodes", error);
    throw error;
  }
}

function createProblemLayerReportItem(
  textNode: TextNode,
  kind: ProblemLayerKind,
  preferredText: string
): ProblemLayerReportItem {
  return {
    kind,
    nodeId: textNode.id,
    nodePath: getProblemLayerPath(textNode),
    textPreview: getProblemLayerCurrentText(textNode, preferredText),
  };
}

function getProblemLayerCurrentText(textNode: TextNode, fallbackText: string): string {
  try {
    return createProblemLayerTextPreview(textNode.characters);
  } catch {
    return createProblemLayerTextPreview(fallbackText);
  }
}

function createProblemLayerTextPreview(text: string): string {
  if (text.length <= PROBLEM_LAYER_TEXT_PREVIEW_MAX_LENGTH) {
    return text;
  }

  // The error window shows only a short preview. Segmenting a million-character
  // layer in full would waste memory even though the rest is never sent to UI.
  const previewSource = text.slice(0, PROBLEM_LAYER_TEXT_PREVIEW_MAX_LENGTH + 64);
  const segments = segmentTextForPointEdits(previewSource);
  let previewEnd = 0;

  for (const segment of segments) {
    if (segment.end > PROBLEM_LAYER_TEXT_PREVIEW_MAX_LENGTH) {
      break;
    }

    previewEnd = segment.end;
  }

  return previewEnd > 0 ? `${previewSource.slice(0, previewEnd)}…` : "…";
}

function getProblemLayerPath(textNode: TextNode): string {
  try {
    const names: string[] = [];
    let current: BaseNode | null | undefined = textNode;

    while (current != null && current.type !== "PAGE" && current.type !== "DOCUMENT") {
      if ("name" in current && typeof current.name === "string" && current.name.trim() !== "") {
        names.unshift(current.name.trim());
      }

      current = "parent" in current ? current.parent : null;
    }

    return names.slice(-3).join(" / ");
  } catch {
    return "";
  }
}

async function restoreTextLayerSnapshot(
  snapshot: TextLayerStateSnapshot,
  mutationJournal: PointTextMutationJournal | null = null,
  rollbackTimeoutMs: number = TEXT_LAYER_ROLLBACK_TIMEOUT_MS
): Promise<TextLayerRollbackResult> {
  let operation: TextLayerRollbackOperation = "verify_initial_snapshot";
  let verificationFailures: TextLayerSnapshotVerificationFailure[] = [];

  try {
    const rollbackDeadlineAt = Date.now() + rollbackTimeoutMs;

    if (verifyRestoredTextLayerSnapshot(snapshot)) {
      return createSuccessfulTextLayerRollbackResult();
    }

    if (snapshot.textNode.characters !== snapshot.text) {
      verificationFailures = ["text"];
      operation = "validate_mutation_journal";

      if (mutationJournal === null) {
        return createFailedTextLayerRollbackResult(
          "mutation_journal_missing",
          operation,
          verificationFailures
        );
      }

      if (!mutationJournal.canInvert) {
        return createFailedTextLayerRollbackResult(
          "mutation_journal_not_invertible",
          operation,
          verificationFailures
        );
      }

      if (snapshot.textNode.characters !== mutationJournal.expectedText) {
        return createFailedTextLayerRollbackResult(
          "mutation_journal_text_mismatch",
          operation,
          verificationFailures
        );
      }

      if (mutationJournal.inverseOperations.length > 0) {
        operation = "apply_inverse_text_mutations";
        applyInversePointTextMutations(snapshot.textNode, mutationJournal);
      } else {
        operation = "plan_text_rollback";
        const rollbackPlan = createPointTextEditPlan(snapshot.textNode.characters, snapshot.text);

        if (!rollbackPlan.matches) {
          return createFailedTextLayerRollbackResult(
            "rollback_plan_mismatch",
            operation,
            verificationFailures
          );
        }

        operation = "apply_planned_text_rollback";
        applyPointTextEditsToTextNode(snapshot.textNode, rollbackPlan.edits);
      }

      operation = "verify_restored_text";
      if (snapshot.textNode.characters !== snapshot.text) {
        return createFailedTextLayerRollbackResult(
          "text_restore_mismatch",
          operation,
          getTextLayerSnapshotVerificationFailures(snapshot)
        );
      }
    }

    operation = "restore_development_marker_data";
    setPluginDataIfChanged(
      snapshot.textNode,
      DEVELOPMENT_MARKER_INDEXES_PLUGIN_DATA_KEY,
      snapshot.developmentMarkerIndexesPluginData
    );
    setPluginDataIfChanged(
      snapshot.textNode,
      DEVELOPMENT_MARKER_TEXT_PLUGIN_DATA_KEY,
      snapshot.developmentMarkerTextPluginData
    );

    operation = "restore_development_marker_fills";
    for (const markerFill of snapshot.developmentMarkerFills) {
      const currentFills = snapshot.textNode.getRangeFills(markerFill.index, markerFill.index + 1);

      if (currentFills === figma.mixed || !areStyleValuesEqual(Array.from(currentFills), Array.from(markerFill.fills))) {
        snapshot.textNode.setRangeFills(markerFill.index, markerFill.index + 1, markerFill.fills);
      }
    }

    operation = "verify_snapshot_after_marker_restore";
    if (verifyRestoredTextLayerSnapshot(snapshot)) {
      return createSuccessfulTextLayerRollbackResult();
    }

    const wholeTextStyle = getWholeTextStyle(snapshot.styles, snapshot.text);

    if (wholeTextStyle !== null) {
      operation = "restore_whole_text_style";
      await restoreWholeTextStyle(snapshot.textNode, wholeTextStyle, true, rollbackDeadlineAt);
    } else {
      operation = "restore_range_text_styles";
      await restoreTextStyles(
        snapshot.textNode,
        buildStyleMap(snapshot.text, snapshot.text, snapshot.styles),
        snapshot.styles,
        true,
        rollbackDeadlineAt
      );
    }

    operation = "verify_final_snapshot";
    if (verifyRestoredTextLayerSnapshot(snapshot)) {
      return createSuccessfulTextLayerRollbackResult();
    }

    verificationFailures = getTextLayerSnapshotVerificationFailures(snapshot);
    return createFailedTextLayerRollbackResult(
      "snapshot_verification_failed",
      operation,
      verificationFailures
    );
  } catch (rollbackError) {
    console.error(`[Чистовик] Failed to restore text layer ${snapshot.textNode.id}`, rollbackError);
    verificationFailures = getTextLayerSnapshotVerificationFailures(snapshot);
    return createFailedTextLayerRollbackResult(
      "operation_failed",
      operation,
      verificationFailures,
      rollbackError
    );
  }
}

function createSuccessfulTextLayerRollbackResult(): TextLayerRollbackResult {
  return {
    failureDiagnostic: null,
    succeeded: true,
  };
}

function createFailedTextLayerRollbackResult(
  reason: TextLayerRollbackFailureReason,
  operation: TextLayerRollbackOperation,
  verificationFailures: TextLayerSnapshotVerificationFailure[],
  error: unknown = null
): TextLayerRollbackResult {
  return {
    failureDiagnostic: {
      errorFingerprint: error === null ? null : createErrorFingerprint(error),
      errorName: error === null ? null : getErrorName(error),
      operation,
      reason,
      verificationFailures,
    },
    succeeded: false,
  };
}

function createTextLayerStateSnapshot(
  textNode: TextNode,
  text: string,
  styles: StyleSegment[]
): TextLayerStateSnapshot {
  return {
    componentPropertyReferences: cloneComponentPropertyReferences(textNode),
    developmentMarkerFills: captureDevelopmentMarkerFills(textNode, text),
    developmentMarkerIndexesPluginData: textNode.getPluginData(DEVELOPMENT_MARKER_INDEXES_PLUGIN_DATA_KEY),
    developmentMarkerTextPluginData: textNode.getPluginData(DEVELOPMENT_MARKER_TEXT_PLUGIN_DATA_KEY),
    parentChainIds: getTextNodeParentChainIds(textNode),
    styles,
    text,
    textNode,
  };
}

function captureDevelopmentMarkerFills(
  textNode: TextNode,
  text: string
): Array<{ fills: Paint[]; index: number }> {
  const result: Array<{ fills: Paint[]; index: number }> = [];
  const fillSegments = textNode.getStyledTextSegments(["fills"]);

  for (const segment of fillSegments) {
    let index = text.indexOf(DEVELOPMENT_NBSP_MARKER, segment.start);

    while (index !== -1 && index < segment.end) {
      result.push({ fills: Array.from(segment.fills), index });
      index = text.indexOf(DEVELOPMENT_NBSP_MARKER, index + 1);
    }
  }

  return result;
}

function cloneComponentPropertyReferences(textNode: TextNode): Record<string, string> | null {
  const references = textNode.componentPropertyReferences;
  return references == null ? null : { ...references };
}

function getTextNodeParentChainIds(textNode: TextNode): string[] {
  const ids: string[] = [];
  let current: BaseNode | null | undefined = textNode.parent;

  while (current != null) {
    ids.push(current.id);
    current = "parent" in current ? current.parent : null;
  }

  return ids;
}

function verifyPreservedTextLayerConnections(snapshot: TextLayerStateSnapshot): boolean {
  try {
    return (
      areStyleValuesEqual(cloneComponentPropertyReferences(snapshot.textNode), snapshot.componentPropertyReferences) &&
      areStyleValuesEqual(getTextNodeParentChainIds(snapshot.textNode), snapshot.parentChainIds)
    );
  } catch (verificationError) {
    console.error(`[Чистовик] Failed to verify text layer component connections for text node ${snapshot.textNode.id}`, verificationError);
    return false;
  }
}

function verifyRestoredOriginalTextState(textNode: TextNode, oldText: string, originalStyles: StyleSegment[]): boolean {
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
  } catch (verificationError) {
    console.error(`[Чистовик] Failed to verify original text layer state for text node ${textNode.id}`, verificationError);
    return false;
  }
}

function verifyRestoredTextLayerSnapshot(snapshot: TextLayerStateSnapshot): boolean {
  try {
    return (
      verifyRestoredOriginalTextState(snapshot.textNode, snapshot.text, snapshot.styles) &&
      verifyDevelopmentMarkerFills(snapshot) &&
      snapshot.textNode.getPluginData(DEVELOPMENT_MARKER_INDEXES_PLUGIN_DATA_KEY) === snapshot.developmentMarkerIndexesPluginData &&
      snapshot.textNode.getPluginData(DEVELOPMENT_MARKER_TEXT_PLUGIN_DATA_KEY) === snapshot.developmentMarkerTextPluginData &&
      verifyPreservedTextLayerConnections(snapshot)
    );
  } catch (verificationError) {
    console.error(`[Чистовик] Failed to verify original text layer snapshot for text node ${snapshot.textNode.id}`, verificationError);
    return false;
  }
}

function getTextLayerSnapshotVerificationFailures(
  snapshot: TextLayerStateSnapshot
): TextLayerSnapshotVerificationFailure[] {
  const failures: TextLayerSnapshotVerificationFailure[] = [];
  let textMatches = false;

  try {
    textMatches = snapshot.textNode.characters === snapshot.text;
  } catch {
    textMatches = false;
  }

  if (!textMatches) {
    failures.push("text");
  } else if (!verifyRestoredOriginalTextState(snapshot.textNode, snapshot.text, snapshot.styles)) {
    failures.push("styles");
  }

  try {
    if (!verifyDevelopmentMarkerFills(snapshot)) {
      failures.push("development_marker_fills");
    }
  } catch {
    failures.push("development_marker_fills");
  }

  try {
    if (
      snapshot.textNode.getPluginData(DEVELOPMENT_MARKER_INDEXES_PLUGIN_DATA_KEY) !==
      snapshot.developmentMarkerIndexesPluginData
    ) {
      failures.push("development_marker_indexes_data");
    }
  } catch {
    failures.push("development_marker_indexes_data");
  }

  try {
    if (
      snapshot.textNode.getPluginData(DEVELOPMENT_MARKER_TEXT_PLUGIN_DATA_KEY) !==
      snapshot.developmentMarkerTextPluginData
    ) {
      failures.push("development_marker_text_data");
    }
  } catch {
    failures.push("development_marker_text_data");
  }

  try {
    if (
      !areStyleValuesEqual(
        cloneComponentPropertyReferences(snapshot.textNode),
        snapshot.componentPropertyReferences
      )
    ) {
      failures.push("component_property_references");
    }
  } catch {
    failures.push("component_property_references");
  }

  try {
    if (!areStyleValuesEqual(getTextNodeParentChainIds(snapshot.textNode), snapshot.parentChainIds)) {
      failures.push("parent_chain");
    }
  } catch {
    failures.push("parent_chain");
  }

  return failures;
}

function verifyDevelopmentMarkerFills(snapshot: TextLayerStateSnapshot): boolean {
  return snapshot.developmentMarkerFills.every((markerFill) => {
    const currentFills = snapshot.textNode.getRangeFills(markerFill.index, markerFill.index + 1);
    return currentFills !== figma.mixed && areStyleValuesEqual(Array.from(currentFills), Array.from(markerFill.fills));
  });
}

function createEmptyTextProcessTimings(): TextProcessTimings {
  return {
    typography: 0,
    numberContext: 0,
    pointEditPlanning: 0,
    fonts: 0,
    readStyles: 0,
    compareText: 0,
    writeText: 0,
    restoreStyles: 0,
    developmentMarkers: 0,
  };
}

function isWhitespaceOnlyText(input: string): boolean {
  try {
    return /^[ \t\r\n\u00A0]*$/.test(input);
  } catch (error) {
    console.error("[Чистовик] Failed to check whitespace-only text", error);
    throw error;
  }
}

function assertTextNodeCharactersUnchanged(textNode: TextNode, expectedText: string): void {
  if (textNode.characters !== expectedText) {
    const error = new Error("Text layer changed while the typograph was preparing the write");
    error.name = TEXT_LAYER_CONTENT_CHANGED_ERROR_NAME;
    throw error;
  }
}

function areTextStyleSegmentsEqual(firstStyles: StyleSegment[], secondStyles: StyleSegment[]): boolean {
  return (
    firstStyles.length === secondStyles.length &&
    firstStyles.every((firstStyle, index) => {
      const secondStyle = secondStyles[index];

      return (
        firstStyle.start === secondStyle.start &&
        firstStyle.end === secondStyle.end &&
        firstStyle.characters === secondStyle.characters &&
        STYLE_FIELDS.every((field) => areStyleValuesEqual(firstStyle[field], secondStyle[field]))
      );
    })
  );
}

function isTextNodeRemoved(textNode: TextNode): boolean {
  try {
    return textNode.removed === true;
  } catch {
    return false;
  }
}

function getStandalonePhoneCountryPrefixIds(textNodes: TextNode[]): Set<string> {
  try {
    const result = new Set<string>();
    const layoutInfos = getTextNodeLayoutInfos(textNodes);
    const phoneTails = layoutInfos.filter((info) => isRussianPhoneTailToken(info.text));

    if (phoneTails.length === 0) {
      return result;
    }

    const phoneTailsByContainer = new Map<string | null, PhoneTailLayoutIndex>();

    for (const tail of phoneTails) {
      const containerTails = phoneTailsByContainer.get(tail.containerId) ?? { byCenterY: [], byX: [] };
      containerTails.byCenterY.push(tail);
      containerTails.byX.push(tail);
      phoneTailsByContainer.set(tail.containerId, containerTails);
    }

    for (const containerTails of phoneTailsByContainer.values()) {
      containerTails.byX.sort((first, second) => first.box.x - second.box.x);
      containerTails.byCenterY.sort((first, second) => getRectCenterY(first.box) - getRectCenterY(second.box));
    }

    for (const prefix of layoutInfos) {
      if (!isStandaloneRussianPhoneCountryPrefix(prefix.text)) {
        continue;
      }

      if (hasRightAdjacentPhoneTail(prefix, phoneTailsByContainer.get(prefix.containerId))) {
        result.add(prefix.id);
      }
    }

    return result;
  } catch (error) {
    console.error("[Чистовик] Failed to find standalone phone country prefixes", error);
    throw error;
  }
}

function hasRightAdjacentPhoneTail(prefix: TextNodeLayoutInfo, tailIndex: PhoneTailLayoutIndex | undefined): boolean {
  if (tailIndex === undefined) {
    return false;
  }

  const minimumTailX = prefix.box.x + prefix.box.width;
  const maximumTailX = minimumTailX + 16;
  const prefixCenterY = getRectCenterY(prefix.box);
  const maximumCenterYDistance = Math.max(4, prefix.box.height / 2);
  const minimumCenterY = prefixCenterY - maximumCenterYDistance;
  const maximumCenterY = prefixCenterY + maximumCenterYDistance;
  const xStart = findLayoutLowerBound(tailIndex.byX, minimumTailX, (tail) => tail.box.x);
  const xEnd = findLayoutUpperBound(tailIndex.byX, maximumTailX, (tail) => tail.box.x);
  const yStart = findLayoutLowerBound(tailIndex.byCenterY, minimumCenterY, (tail) => getRectCenterY(tail.box));
  const yEnd = findLayoutUpperBound(tailIndex.byCenterY, maximumCenterY, (tail) => getRectCenterY(tail.box));
  const xCandidatesCount = xEnd - xStart;
  const yCandidatesCount = yEnd - yStart;

  if (xCandidatesCount <= yCandidatesCount) {
    for (let index = xStart; index < xEnd; index += 1) {
      if (isRightAdjacentSameLineText(prefix.box, tailIndex.byX[index].box)) {
        return true;
      }
    }
  } else {
    for (let index = yStart; index < yEnd; index += 1) {
      if (isRightAdjacentSameLineText(prefix.box, tailIndex.byCenterY[index].box)) {
        return true;
      }
    }
  }

  return false;
}

function findLayoutLowerBound(
  items: TextNodeLayoutInfo[],
  minimumValue: number,
  getValue: (item: TextNodeLayoutInfo) => number
): number {
  let low = 0;
  let high = items.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);

    if (getValue(items[middle]) < minimumValue) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low;
}

function findLayoutUpperBound(
  items: TextNodeLayoutInfo[],
  maximumValue: number,
  getValue: (item: TextNodeLayoutInfo) => number
): number {
  let low = 0;
  let high = items.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);

    if (getValue(items[middle]) <= maximumValue) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low;
}

function getRectCenterY(rect: Rect): number {
  return rect.y + rect.height / 2;
}

function getTextNodeLayoutInfos(textNodes: TextNode[]): TextNodeLayoutInfo[] {
  try {
    const result: TextNodeLayoutInfo[] = [];

    for (const textNode of textNodes) {
      try {
        if (isTextNodeRemoved(textNode)) {
          continue;
        }

        const text = textNode.characters;

        if (
          isWhitespaceOnlyText(text) ||
          (!isStandaloneRussianPhoneCountryPrefix(text) && !isRussianPhoneTailToken(text)) ||
          textNode.absoluteBoundingBox === null
        ) {
          continue;
        }

        result.push({
          box: textNode.absoluteBoundingBox,
          containerId: textNode.parent?.id ?? null,
          id: textNode.id,
          text,
        });
      } catch (error) {
        if (!isTextNodeRemoved(textNode)) {
          throw error;
        }

        console.warn("[Чистовик] Skipped missing text node while reading layout");
      }
    }

    return result;
  } catch (error) {
    console.error("[Чистовик] Failed to collect text node layout info", error);
    throw error;
  }
}

function isRightAdjacentSameLineText(left: Rect, right: Rect): boolean {
  try {
    const leftRight = left.x + left.width;
    const horizontalGap = right.x - leftRight;
    const leftCenterY = left.y + left.height / 2;
    const rightCenterY = right.y + right.height / 2;

    return horizontalGap >= 0 && horizontalGap <= 16 && Math.abs(leftCenterY - rightCenterY) <= Math.max(4, Math.min(left.height, right.height) / 2);
  } catch (error) {
    console.error("[Чистовик] Failed to compare text layer positions", error);
    throw error;
  }
}

async function loadFontsForTextNode(
  textNode: TextNode,
  fontLoadCache: Map<string, Promise<void>>,
  loadedFontKeys: Set<string> = new Set<string>(),
  loadingBudget?: FontLoadingBudget
): Promise<void> {
  try {
    const fonts = new Map<string, FontName>();

    if (textNode.characters.length === 0) {
      return;
    }

    for (const font of textNode.getRangeAllFontNames(0, textNode.characters.length)) {
      fonts.set(`${font.family}\n${font.style}`, font);
    }

    const cachedPromises: Promise<void>[] = [];
    const newFonts: FontName[] = [];

    for (const [key, font] of fonts) {
      const cachedPromise = fontLoadCache.get(key);

      if (cachedPromise === undefined) {
        newFonts.push(font);
      } else {
        cachedPromises.push(cachedPromise);
      }
    }

    // Cached failures must stop the layer before new requests are started.
    // Cached successes return immediately and do not spend the waiting budget again.
    await Promise.all(cachedPromises);

    if (newFonts.length === 0) {
      return;
    }

    const waitStartedAt = getMonotonicTimeMs();
    const deadlineAt = loadingBudget === undefined
      ? undefined
      : Date.now() + Math.max(0, loadingBudget.remainingMs);
    let firstError: unknown = null;

    try {
      const results = await Promise.all(
        newFonts.map((font) =>
          getFontLoadPromise(font, fontLoadCache, loadedFontKeys, deadlineAt).then(
            () => null,
            (error) => error
          )
        )
      );
      firstError = results.find((result) => result !== null) ?? null;
    } finally {
      if (loadingBudget !== undefined) {
        loadingBudget.remainingMs = Math.max(
          0,
          loadingBudget.remainingMs - Math.max(0, getMonotonicTimeMs() - waitStartedAt)
        );
      }
    }

    if (firstError !== null) {
      throw firstError;
    }
  } catch (error) {
    console.error(`[Чистовик] Failed to load fonts for text node ${textNode.id}`, error);
    throw error;
  }
}

function getFontLoadPromise(
  font: FontName,
  fontLoadCache: Map<string, Promise<void>>,
  loadedFontKeys: Set<string> = new Set<string>(),
  deadlineAt?: number
): Promise<void> {
  const key = `${font.family}\n${font.style}`;
  const cachedPromise = fontLoadCache.get(key);

  if (cachedPromise !== undefined) {
    return cachedPromise;
  }

  const loadPromise = withBoundedFigmaOperation(() => figma.loadFontAsync(font), "font_load", deadlineAt).then(
    () => {
      loadedFontKeys.add(key);
    },
    (error) => {
      throw error;
    }
  );

  fontLoadCache.set(key, loadPromise);
  return loadPromise;
}

function captureTextStyles(textNode: TextNode): StyleSegment[] {
  try {
    if (textNode.characters.length === 0) {
      return [];
    }

    const segments = textNode.getStyledTextSegments(STYLE_FIELDS);
    const nodeTextStyleId = getNodeStyleId(textNode.textStyleId);
    const nodeFillStyleId = getNodeStyleId(textNode.fillStyleId);

    return segments.map((segment) => ({
      ...segment,
      fillStyleId: getPreservedRangeStyleId(
        textNode,
        segment.start,
        segment.end,
        segment.fillStyleId,
        nodeFillStyleId,
        (start, end) => textNode.getRangeFillStyleId(start, end)
      ),
      textStyleId: getPreservedRangeStyleId(
        textNode,
        segment.start,
        segment.end,
        segment.textStyleId,
        nodeTextStyleId,
        (start, end) => textNode.getRangeTextStyleId(start, end)
      ),
    }));
  } catch (error) {
    console.error(`[Чистовик] Failed to capture text styles for text node ${textNode.id}`, error);
    throw error;
  }
}

async function assertLinkedResourcesAvailable(
  styles: StyleSegment[],
  styleCache: Map<string, Promise<void>>,
  variableCache: Map<string, Promise<void>>
): Promise<void> {
  try {
    const linkedStyles = new Map<string, StyleType>();
    const linkedVariableIds = new Set<string>();

    for (const style of styles) {
      if (style.textStyleId !== "") {
        linkedStyles.set(style.textStyleId, "TEXT");
      }

      if (style.fillStyleId !== "") {
        linkedStyles.set(style.fillStyleId, "PAINT");
      }

      collectVariableAliasIds(style.boundVariables, linkedVariableIds);
    }

    for (const [styleId, expectedType] of linkedStyles) {
      const cacheKey = `${expectedType}:${styleId}`;
      let availabilityPromise = styleCache.get(cacheKey);

      if (availabilityPromise === undefined) {
        availabilityPromise = withFigmaOperationTimeout(() => figma.getStyleByIdAsync(styleId), "linked_style_load").then(
          (style) => {
            if (style === null || style.type !== expectedType) {
              throw new Error("Linked style is unavailable");
            }
          }
        );
        styleCache.set(cacheKey, availabilityPromise);
      }

      await availabilityPromise;
    }

    for (const variableId of linkedVariableIds) {
      let availabilityPromise = variableCache.get(variableId);

      if (availabilityPromise === undefined) {
        availabilityPromise = withFigmaOperationTimeout(
          () => figma.variables.getVariableByIdAsync(variableId),
          "linked_variable_load"
        ).then((variable) => {
          if (variable === null) {
            throw new Error("Variable does not exist");
          }
        });
        variableCache.set(variableId, availabilityPromise);
      }

      await availabilityPromise;
    }
  } catch (error) {
    console.error("[Чистовик] Linked style or variable is unavailable before text replacement", error);
    throw error;
  }
}

function collectVariableAliasIds(value: unknown, result: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectVariableAliasIds(item, result);
    }

    return;
  }

  if (typeof value !== "object" || value === null) {
    return;
  }

  const record = value as Record<string, unknown>;

  if (record.type === "VARIABLE_ALIAS" && typeof record.id === "string") {
    result.add(record.id);
    return;
  }

  for (const nestedValue of Object.values(record)) {
    collectVariableAliasIds(nestedValue, result);
  }
}

function getNodeStyleId(styleId: string | PluginAPI["mixed"]): string | null {
  try {
    return typeof styleId === "string" && styleId !== "" ? styleId : null;
  } catch {
    return null;
  }
}

function getPreservedRangeStyleId(
  textNode: TextNode,
  start: number,
  end: number,
  segmentStyleId: string,
  nodeStyleId: string | null,
  getRangeStyleId: (start: number, end: number) => string | PluginAPI["mixed"]
): string {
  try {
    const rangeStyleId = getRangeStyleId(start, end);

    if (typeof rangeStyleId === "string") {
      if (rangeStyleId !== "") {
        return rangeStyleId;
      }

      if (segmentStyleId !== "") {
        return segmentStyleId;
      }

      return nodeStyleId ?? "";
    }

    if (segmentStyleId !== "") {
      return segmentStyleId;
    }

    const characterStyleId = getCommonCharacterStyleId(textNode, start, end, getRangeStyleId);

    if (characterStyleId !== null) {
      return characterStyleId;
    }

    return segmentStyleId;
  } catch (error) {
    console.error("[Чистовик] Failed to preserve range style id", error);
    throw error;
  }
}

function getCommonCharacterStyleId(
  textNode: TextNode,
  start: number,
  end: number,
  getRangeStyleId: (start: number, end: number) => string | PluginAPI["mixed"]
): string | null {
  try {
    let commonStyleId: string | null = null;

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
  } catch (error) {
    console.error(`[Чистовик] Failed to capture character style id for text node ${textNode.id}`, error);
    throw error;
  }
}

function getWholeTextStyle(styles: StyleSegment[], oldText: string): StyleSegment | null {
  try {
    if (styles.length !== 1) {
      return null;
    }

    const style = styles[0];

    if (
      style.start !== 0 ||
      style.end !== oldText.length ||
      style.textStyleId === "" ||
      style.textStyleOverrides.length > 0 ||
      hasBoundStyleVariables(style) ||
      style.listOptions.type !== "NONE" ||
      style.listSpacing !== 0 ||
      style.indentation !== 0 ||
      style.paragraphIndent !== 0 ||
      style.paragraphSpacing !== 0
    ) {
      return null;
    }

    return style;
  } catch (error) {
    console.error("[Чистовик] Failed to detect whole text style", error);
    throw error;
  }
}

function hasBoundStyleVariables(style: StyleSegment): boolean {
  try {
    return style.boundVariables !== undefined && Object.keys(style.boundVariables).length > 0;
  } catch {
    return true;
  }
}

async function restoreWholeTextStyle(
  textNode: TextNode,
  style: StyleSegment,
  skipUnchangedLinkedStyleIds: boolean = false,
  deadlineAt?: number
): Promise<void> {
  try {
    const rangeEnd = textNode.characters.length;

    if (!skipUnchangedLinkedStyleIds || textNode.getRangeTextStyleId(0, rangeEnd) !== style.textStyleId) {
      await withBoundedFigmaOperation(
        () => textNode.setTextStyleIdAsync(style.textStyleId),
        "restore_whole_text_style",
        deadlineAt
      );
    }

    if (
      style.fillStyleId !== "" &&
      (!skipUnchangedLinkedStyleIds || textNode.getRangeFillStyleId(0, rangeEnd) !== style.fillStyleId)
    ) {
      await withBoundedFigmaOperation(
        () => textNode.setFillStyleIdAsync(style.fillStyleId),
        "restore_whole_fill_style",
        deadlineAt
      );
    }

    if (hasTextDecoration(style)) {
      restoreTextDecoration(textNode, 0, textNode.characters.length, style);
    }
  } catch (error) {
    console.error(`[Чистовик] Failed to restore whole text style for text node ${textNode.id}`, error);
    throw error;
  }
}

function hasTextDecoration(style: StyleSegment): boolean {
  return style.textDecoration !== "NONE";
}

function createStyleRestorationPlan(oldText: string, newText: string, styles: StyleSegment[]): StyleRestorationPlan {
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
        styleMap: new Array<number>(newText.length).fill(0),
        wholeTextStyle: null,
        verifyUniformLinkedStyle,
      };
    }

    return {
      styleMap: buildStyleMap(oldText, newText, styles),
      wholeTextStyle: null,
      verifyUniformLinkedStyle: false,
    };
  } catch (error) {
    console.error("[Чистовик] Failed to create style restoration plan", error);
    throw error;
  }
}

function canVerifyUniformLinkedStyle(oldText: string, styles: StyleSegment[]): boolean {
  try {
    if (styles.length !== 1) {
      return false;
    }

    const style = styles[0];
    const coversWholeText = style.start === 0 && style.end === oldText.length;
    const hasLibraryLink = style.textStyleId !== "" || style.fillStyleId !== "";
    return coversWholeText && hasLibraryLink;
  } catch {
    return false;
  }
}

function verifyUniformStylePreservation(textNode: TextNode, originalStyle: StyleSegment): boolean {
  try {
    const currentStyles = captureTextStyles(textNode);

    if (currentStyles.length !== 1) {
      return false;
    }

    const currentStyle = currentStyles[0];

    if (currentStyle.start !== 0 || currentStyle.end !== textNode.characters.length) {
      return false;
    }

    if (
      (originalStyle.textStyleId !== "" && currentStyle.textStyleId !== originalStyle.textStyleId) ||
      (originalStyle.fillStyleId !== "" && currentStyle.fillStyleId !== originalStyle.fillStyleId)
    ) {
      return false;
    }

    return STYLE_FIELDS.every((field) => areStyleValuesEqual(currentStyle[field], originalStyle[field]));
  } catch (error) {
    console.error(`[Чистовик] Failed to verify style preservation for text node ${textNode.id}`, error);
    return false;
  }
}

function verifyTextStyleRestorationPlan(textNode: TextNode, styleMap: number[], originalStyles: StyleSegment[]): boolean {
  try {
    if (textNode.characters.length === 0) {
      return styleMap.length === 0;
    }

    if (styleMap.length !== textNode.characters.length || originalStyles.length === 0) {
      return false;
    }

    const currentStyles = captureTextStyles(textNode);
    let characterIndex = 0;
    let currentStyleIndex = 0;

    while (characterIndex < textNode.characters.length) {
      while (currentStyleIndex < currentStyles.length && characterIndex >= currentStyles[currentStyleIndex].end) {
        currentStyleIndex += 1;
      }

      const currentStyle = currentStyles[currentStyleIndex];
      const expectedStyleIndex = styleMap[characterIndex] ?? -1;
      const expectedStyle = originalStyles[expectedStyleIndex];

      if (
        currentStyle === undefined ||
        expectedStyle === undefined ||
        characterIndex < currentStyle.start ||
        !STYLE_FIELDS.every((field) => areStyleValuesEqual(currentStyle[field], expectedStyle[field]))
      ) {
        return false;
      }

      let expectedRunEnd = characterIndex + 1;

      while (expectedRunEnd < styleMap.length && styleMap[expectedRunEnd] === expectedStyleIndex) {
        expectedRunEnd += 1;
      }

      characterIndex = Math.min(currentStyle.end, expectedRunEnd);
    }

    return true;
  } catch (error) {
    console.error(`[Чистовик] Failed to verify restored mixed styles for text node ${textNode.id}`, error);
    return false;
  }
}

function areStyleValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => areStyleValuesEqual(value, right[index]))
    );
  }

  if (typeof left !== "object" || left === null || typeof right !== "object" || right === null) {
    return false;
  }

  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key, index) => key === rightKeys[index] && areStyleValuesEqual(leftRecord[key], rightRecord[key]))
  );
}

function buildStyleMap(oldText: string, newText: string, styles: StyleSegment[]): number[] {
  try {
    const oldIndexToStyle = new Array<number>(oldText.length).fill(0);

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
      const safeIndex = Math.max(0, Math.min(oldText.length - 1, oldIndex));
      return oldIndexToStyle[safeIndex] ?? 0;
    });
  } catch (error) {
    console.error("[Чистовик] Failed to build style map", error);
    throw error;
  }
}

function buildOldIndexMap(oldText: string, newText: string): number[] {
  try {
    if (oldText.length === 0) {
      return new Array<number>(newText.length).fill(0);
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
        } else {
          table[current] = Math.max(table[(oldIndex + 1) * width + newIndex], table[oldIndex * width + newIndex + 1]);
        }
      }
    }

    const result = new Array<number>(newLength).fill(0);
    let oldIndex = 0;
    let newIndex = 0;
    let lastMappedOldIndex = 0;

    while (oldIndex < oldLength && newIndex < newLength) {
      if (oldText[oldIndex] === newText[newIndex]) {
        result[newIndex] = oldIndex;
        lastMappedOldIndex = oldIndex;
        oldIndex += 1;
        newIndex += 1;
      } else if (table[(oldIndex + 1) * width + newIndex] >= table[oldIndex * width + newIndex + 1]) {
        oldIndex += 1;
      } else {
        result[newIndex] = lastMappedOldIndex;
        newIndex += 1;
      }
    }

    while (newIndex < newLength) {
      result[newIndex] = Math.min(lastMappedOldIndex, oldLength - 1);
      newIndex += 1;
    }

    return preserveCurrencySymbolStyleSources(oldText, newText, result);
  } catch (error) {
    console.error("[Чистовик] Failed to build old index map", error);
    throw error;
  }
}

function buildGreedyOldIndexMap(oldText: string, newText: string): number[] {
  try {
    const result: number[] = [];
    let oldIndex = 0;

    for (let newIndex = 0; newIndex < newText.length; newIndex += 1) {
      const nextOldIndex = oldText.indexOf(newText[newIndex], oldIndex);

      if (nextOldIndex === -1) {
        result.push(Math.max(0, oldIndex - 1));
      } else {
        result.push(nextOldIndex);
        oldIndex = nextOldIndex + 1;
      }
    }

    return preserveCurrencySymbolStyleSources(oldText, newText, result);
  } catch (error) {
    console.error("[Чистовик] Failed to build greedy old index map", error);
    throw error;
  }
}

function preserveCurrencySymbolStyleSources(oldText: string, newText: string, oldIndexMap: number[]): number[] {
  try {
    for (const currency of QUANTITY_CURRENCY_SYMBOLS) {
      const oldPositions: number[] = [];
      const newPositions: number[] = [];

      for (let index = 0; index < oldText.length; index += 1) {
        if (oldText[index] === currency) {
          oldPositions.push(index);
        }
      }

      for (let index = 0; index < newText.length; index += 1) {
        if (newText[index] === currency) {
          newPositions.push(index);
        }
      }

      if (newPositions.length === 1 && oldPositions.length > 1) {
        oldIndexMap[newPositions[0]] = oldPositions[oldPositions.length - 1];
        continue;
      }

      if (oldPositions.length !== newPositions.length) {
        continue;
      }

      for (let index = 0; index < newPositions.length; index += 1) {
        oldIndexMap[newPositions[index]] = oldPositions[index];
      }
    }

    return oldIndexMap;
  } catch (error) {
    console.error("[Чистовик] Failed to preserve currency symbol style sources", error);
    throw error;
  }
}

async function restoreTextStyles(
  textNode: TextNode,
  styleMap: number[],
  styles: StyleSegment[],
  skipUnchangedLinkedStyleIds: boolean = false,
  deadlineAt?: number
): Promise<void> {
  try {
    if (textNode.characters.length === 0 || styles.length === 0 || styleMap.length === 0) {
      return;
    }

    let start = 0;
    let currentStyleIndex = styleMap[0] ?? 0;
    const variableCache = new Map<string, Promise<Variable | null>>();

    for (let index = 1; index <= styleMap.length; index += 1) {
      const nextStyleIndex = styleMap[index] ?? -1;

      if (nextStyleIndex === currentStyleIndex && index < styleMap.length) {
        continue;
      }

      await applyStyleSegment(
        textNode,
        start,
        index,
        styles[currentStyleIndex],
        variableCache,
        skipUnchangedLinkedStyleIds,
        deadlineAt
      );
      start = index;
      currentStyleIndex = nextStyleIndex;
    }
  } catch (error) {
    console.error(`[Чистовик] Failed to restore text styles for text node ${textNode.id}`, error);
    throw error;
  }
}

async function applyStyleSegment(
  textNode: TextNode,
  start: number,
  end: number,
  style: StyleSegment,
  variableCache: Map<string, Promise<Variable | null>>,
  skipUnchangedLinkedStyleIds: boolean,
  deadlineAt?: number
): Promise<void> {
  try {
    assertOperationDeadline(deadlineAt, "restore_style_segment");

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
    await restoreStyleIds(textNode, start, end, style, skipUnchangedLinkedStyleIds, deadlineAt);
    await restoreBoundVariables(textNode, start, end, style, variableCache, deadlineAt);
    restoreOverriddenStyleProperties(textNode, start, end, style);
  } catch (error) {
    console.error("[Чистовик] Failed to apply style segment", error);
    throw error;
  }
}

function restoreDetachedTextProperties(textNode: TextNode, start: number, end: number, style: StyleSegment): void {
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
  } catch (error) {
    console.error("[Чистовик] Failed to restore detached text properties", error);
    throw error;
  }
}

function restoreDetachedFillProperties(textNode: TextNode, start: number, end: number, style: StyleSegment): void {
  try {
    if (style.fillStyleId !== "") {
      return;
    }

    textNode.setRangeFills(start, end, style.fills);
  } catch (error) {
    console.error("[Чистовик] Failed to restore detached fill properties", error);
    throw error;
  }
}

async function restoreStyleIds(
  textNode: TextNode,
  start: number,
  end: number,
  style: StyleSegment,
  skipUnchangedLinkedStyleIds: boolean,
  deadlineAt?: number
): Promise<void> {
  try {
    if (
      style.textStyleId !== "" &&
      (!skipUnchangedLinkedStyleIds || textNode.getRangeTextStyleId(start, end) !== style.textStyleId)
    ) {
      await withBoundedFigmaOperation(
        () => textNode.setRangeTextStyleIdAsync(start, end, style.textStyleId),
        "restore_range_text_style",
        deadlineAt
      );
    }

    if (
      style.fillStyleId !== "" &&
      (!skipUnchangedLinkedStyleIds || textNode.getRangeFillStyleId(start, end) !== style.fillStyleId)
    ) {
      await withBoundedFigmaOperation(
        () => textNode.setRangeFillStyleIdAsync(start, end, style.fillStyleId),
        "restore_range_fill_style",
        deadlineAt
      );
    }
  } catch (error) {
    console.error("[Чистовик] Failed to restore style ids", error);
    throw error;
  }
}

function restoreOverriddenStyleProperties(textNode: TextNode, start: number, end: number, style: StyleSegment): void {
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
  } catch (error) {
    console.error("[Чистовик] Failed to restore overridden style properties", error);
    throw error;
  }
}

function shouldRestoreStyleOverride(style: StyleSegment, overrideType: TextStyleOverrideType["type"]): boolean {
  try {
    if (style.textStyleId === "") {
      return true;
    }

    return style.textStyleOverrides.some((override) => override.type === overrideType);
  } catch {
    return false;
  }
}

function restoreTextDecoration(textNode: TextNode, start: number, end: number, style: StyleSegment): void {
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
  } catch (error) {
    console.error("[Чистовик] Failed to restore text decoration", error);
    throw error;
  }
}

function restoreHyperlink(textNode: TextNode, start: number, end: number, style: StyleSegment): void {
  try {
    textNode.setRangeHyperlink(start, end, style.hyperlink);
  } catch (error) {
    console.error("[Чистовик] Failed to restore hyperlink", error);
    throw error;
  }
}

async function restoreBoundVariables(
  textNode: TextNode,
  start: number,
  end: number,
  style: StyleSegment,
  variableCache: Map<string, Promise<Variable | null>>,
  deadlineAt?: number
): Promise<void> {
  try {
    if (style.boundVariables === undefined) {
      return;
    }

    const entries = Object.entries(style.boundVariables) as Array<[VariableBindableTextField, VariableAlias]>;

    for (const [field, variableAlias] of entries) {
      let variablePromise = variableCache.get(variableAlias.id);

      if (variablePromise === undefined) {
        variablePromise = withBoundedFigmaOperation(
          () => figma.variables.getVariableByIdAsync(variableAlias.id),
          "restore_bound_variable",
          deadlineAt
        );
        variableCache.set(variableAlias.id, variablePromise);
      }

      const variable = await variablePromise;

      if (variable !== null) {
        textNode.setRangeBoundVariable(start, end, field, variable);
      }
    }
  } catch (error) {
    console.error("[Чистовик] Failed to restore bound variables", error);
    throw error;
  }
}

function applyDevelopmentMarkerStyles(textNode: TextNode, markerIndexes: number[]): void {
  try {
    for (const index of markerIndexes) {
      if (textNode.characters[index] === DEVELOPMENT_NBSP_MARKER) {
        textNode.setRangeFills(index, index + 1, [createDevelopmentMarkerFill()]);
      }
    }
  } catch (error) {
    console.error(`[Чистовик] Failed to apply development marker styles for text node ${textNode.id}`, error);
    throw error;
  }
}

function needsDevelopmentMarkerStyles(textNode: TextNode, markerIndexes: number[]): boolean {
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
  } catch (error) {
    console.error(`[Чистовик] Failed to check development marker styles for text node ${textNode.id}`, error);
    throw error;
  }
}

function isDevelopmentMarkerFills(fills: readonly Paint[]): boolean {
  try {
    return fills.length === 1 && isDevelopmentMarkerFill(fills[0]);
  } catch (error) {
    console.error("[Чистовик] Failed to check development marker fills", error);
    throw error;
  }
}

function isDevelopmentMarkerFill(fill: Paint): boolean {
  try {
    return fill.type === "SOLID" &&
      Math.abs(fill.color.r - DEVELOPMENT_NBSP_FILL.color.r) <= DEVELOPMENT_MARKER_COLOR_TOLERANCE &&
      Math.abs(fill.color.g - DEVELOPMENT_NBSP_FILL.color.g) <= DEVELOPMENT_MARKER_COLOR_TOLERANCE &&
      Math.abs(fill.color.b - DEVELOPMENT_NBSP_FILL.color.b) <= DEVELOPMENT_MARKER_COLOR_TOLERANCE &&
      (fill.opacity ?? 1) === 1;
  } catch (error) {
    console.error("[Чистовик] Failed to check development marker fill", error);
    throw error;
  }
}

function createDevelopmentMarkerFill(): SolidPaint {
  try {
    return {
      type: DEVELOPMENT_NBSP_FILL.type,
      color: {
        r: DEVELOPMENT_NBSP_FILL.color.r,
        g: DEVELOPMENT_NBSP_FILL.color.g,
        b: DEVELOPMENT_NBSP_FILL.color.b,
      },
    };
  } catch (error) {
    console.error("[Чистовик] Failed to create development marker fill", error);
    throw error;
  }
}

function getExistingDevelopmentMarkerIndexes(textNode: TextNode): number[] {
  try {
    const indexes = new Set<number>(getStoredDevelopmentMarkerIndexes(textNode));
    const text = textNode.characters;

    if (!text.includes(DEVELOPMENT_NBSP_MARKER)) {
      return Array.from(indexes).sort((first, second) => first - second);
    }

    const fillSegments = textNode.getStyledTextSegments(["fills"]);

    for (const segment of fillSegments) {
      if (!isDevelopmentMarkerFills(segment.fills)) {
        continue;
      }

      let index = text.indexOf(DEVELOPMENT_NBSP_MARKER, segment.start);

      while (index !== -1 && index < segment.end) {
        indexes.add(index);
        index = text.indexOf(DEVELOPMENT_NBSP_MARKER, index + 1);
      }
    }

    return Array.from(indexes).sort((first, second) => first - second);
  } catch (error) {
    console.error(`[Чистовик] Failed to get existing development marker indexes for text node ${textNode.id}`, error);
    throw error;
  }
}

function getStoredDevelopmentMarkerIndexes(textNode: TextNode): number[] {
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

    return parsedIndexes.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < text.length && text[index] === DEVELOPMENT_NBSP_MARKER);
  } catch (error) {
    console.error(`[Чистовик] Failed to get stored development marker indexes for text node ${textNode.id}`, error);
    return [];
  }
}

function syncDevelopmentMarkerPluginData(textNode: TextNode, options: PluginRunOptions, markerIndexes: number[]): void {
  try {
    if (options.mode === "development" && markerIndexes.length > 0) {
      setPluginDataIfChanged(textNode, DEVELOPMENT_MARKER_TEXT_PLUGIN_DATA_KEY, textNode.characters);
      setPluginDataIfChanged(textNode, DEVELOPMENT_MARKER_INDEXES_PLUGIN_DATA_KEY, JSON.stringify(markerIndexes));
      return;
    }

    setPluginDataIfChanged(textNode, DEVELOPMENT_MARKER_TEXT_PLUGIN_DATA_KEY, "");
    setPluginDataIfChanged(textNode, DEVELOPMENT_MARKER_INDEXES_PLUGIN_DATA_KEY, "");
  } catch (error) {
    console.error(`[Чистовик] Failed to sync development marker plugin data for text node ${textNode.id}`, error);
    throw error;
  }
}

function needsDevelopmentMarkerPluginDataSync(textNode: TextNode, options: PluginRunOptions, markerIndexes: number[]): boolean {
  const expectedText = options.mode === "development" && markerIndexes.length > 0 ? textNode.characters : "";
  const expectedIndexes = options.mode === "development" && markerIndexes.length > 0 ? JSON.stringify(markerIndexes) : "";

  return (
    textNode.getPluginData(DEVELOPMENT_MARKER_TEXT_PLUGIN_DATA_KEY) !== expectedText ||
    textNode.getPluginData(DEVELOPMENT_MARKER_INDEXES_PLUGIN_DATA_KEY) !== expectedIndexes
  );
}

function setPluginDataIfChanged(textNode: TextNode, key: string, value: string): void {
  try {
    if (textNode.getPluginData(key) !== value) {
      textNode.setPluginData(key, value);
    }
  } catch (error) {
    console.error(`[Чистовик] Failed to update plugin data for text node ${textNode.id}`, error);
    throw error;
  }
}

function calculatePointTextEdits(oldText: string, newText: string): PointTextEdit[] {
  try {
    if (oldText === newText) {
      return [];
    }

    const oldSegments = segmentTextForPointEdits(oldText);
    const newSegments = segmentTextForPointEdits(newText);
    let commonPrefixLength = 0;

    while (
      commonPrefixLength < oldSegments.length &&
      commonPrefixLength < newSegments.length &&
      oldSegments[commonPrefixLength].text === newSegments[commonPrefixLength].text
    ) {
      commonPrefixLength += 1;
    }

    let commonSuffixLength = 0;

    while (
      commonSuffixLength < oldSegments.length - commonPrefixLength &&
      commonSuffixLength < newSegments.length - commonPrefixLength &&
      oldSegments[oldSegments.length - commonSuffixLength - 1].text === newSegments[newSegments.length - commonSuffixLength - 1].text
    ) {
      commonSuffixLength += 1;
    }

    const oldMiddle = oldSegments.slice(commonPrefixLength, oldSegments.length - commonSuffixLength);
    const newMiddle = newSegments.slice(commonPrefixLength, newSegments.length - commonSuffixLength);
    const middleStart = getPointEditBoundary(oldSegments, commonPrefixLength, oldText.length);

    if (oldMiddle.length === 0 || newMiddle.length === 0) {
      return refinePointTextEditsForStylePreservation(oldText, [
        {
          start: middleStart,
          end: getPointEditBoundary(oldSegments, oldSegments.length - commonSuffixLength, oldText.length),
          insertText: newMiddle.map((segment) => segment.text).join(""),
        },
      ]);
    }

    const diffSteps = buildPointEditDiffSteps(
      oldMiddle.map((segment) => segment.text),
      newMiddle.map((segment) => segment.text)
    );

    if (diffSteps === null) {
      return refinePointTextEditsForStylePreservation(oldText, [
        {
          start: middleStart,
          end: getPointEditBoundary(oldSegments, oldSegments.length - commonSuffixLength, oldText.length),
          insertText: newMiddle.map((segment) => segment.text).join(""),
        },
      ]);
    }

    return refinePointTextEditsForStylePreservation(oldText, pointEditDiffStepsToEdits(diffSteps, oldMiddle, middleStart));
  } catch (error) {
    console.error("[Чистовик] Failed to calculate point text edits", error);
    throw error;
  }
}

function refinePointTextEditsForStylePreservation(oldText: string, edits: PointTextEdit[]): PointTextEdit[] {
  try {
    const refinedEdits: PointTextEdit[] = [];

    for (const edit of edits) {
      for (const alignedEdit of splitPointTextEditByAlignedSegments(oldText, edit)) {
        refinedEdits.push(...splitPointTextEditBySemanticPunctuation(oldText, alignedEdit));
      }
    }

    return refinedEdits;
  } catch (error) {
    console.error("[Чистовик] Failed to refine point text edits for style preservation", error);
    throw error;
  }
}

function splitPointTextEditByAlignedSegments(oldText: string, edit: PointTextEdit): PointTextEdit[] {
  if (edit.start === edit.end || edit.insertText === "") {
    return [edit];
  }

  const oldSegments = segmentTextForPointEdits(oldText.slice(edit.start, edit.end));
  const newSegments = segmentTextForPointEdits(edit.insertText);

  if (oldSegments.length <= 1 || oldSegments.length !== newSegments.length) {
    return [edit];
  }

  const result: PointTextEdit[] = [];

  for (let index = 0; index < oldSegments.length; index += 1) {
    const oldSegment = oldSegments[index];
    const newSegment = newSegments[index];

    if (oldSegment.text === newSegment.text) {
      continue;
    }

    result.push({
      start: edit.start + oldSegment.start,
      end: edit.start + oldSegment.end,
      insertText: newSegment.text,
    });
  }

  return result.length > 0 ? result : [edit];
}

function splitPointTextEditBySemanticPunctuation(oldText: string, edit: PointTextEdit): PointTextEdit[] {
  if (edit.start === edit.end || edit.insertText === "") {
    return [edit];
  }

  const oldUnits = segmentSemanticPunctuation(oldText.slice(edit.start, edit.end));
  const newUnits = segmentSemanticPunctuation(edit.insertText);

  if (
    oldUnits === null ||
    newUnits === null ||
    oldUnits.length <= 1 ||
    oldUnits.length !== newUnits.length ||
    oldUnits.some((unit, index) => unit.key !== newUnits[index].key)
  ) {
    return [edit];
  }

  return oldUnits.map((oldUnit, index) => ({
    start: edit.start + oldUnit.start,
    end: edit.start + oldUnit.end,
    insertText: newUnits[index].text,
  }));
}

function segmentSemanticPunctuation(
  text: string
): Array<PointEditTextSegment & { key: "ellipsis" | "quote" }> | null {
  const units: Array<PointEditTextSegment & { key: "ellipsis" | "quote" }> = [];
  let index = 0;

  while (index < text.length) {
    if (text.startsWith("...", index)) {
      units.push({ start: index, end: index + 3, text: "...", key: "ellipsis" });
      index += 3;
      continue;
    }

    const character = text[index];

    if (character === "…") {
      units.push({ start: index, end: index + 1, text: character, key: "ellipsis" });
      index += 1;
      continue;
    }

    if (/^["«»„“”]$/.test(character)) {
      units.push({ start: index, end: index + 1, text: character, key: "quote" });
      index += 1;
      continue;
    }

    return null;
  }

  return units;
}

function createPointTextEditPlan(oldText: string, newText: string): PointTextEditPlanResult {
  try {
    const edits = calculatePointTextEdits(oldText, newText);
    return {
      edits,
      matches: applyPointTextEditsToString(oldText, edits) === newText,
      operationsCount: edits.length,
    };
  } catch (error) {
    console.error("[Чистовик] Failed to create point text edit plan", error);
    return {
      edits: [],
      matches: false,
      operationsCount: 0,
    };
  }
}

function applyPointTextEditsToString(input: string, edits: PointTextEdit[]): string {
  try {
    const validBoundaries = new Set<number>([0, input.length]);

    for (const segment of segmentTextForPointEdits(input)) {
      validBoundaries.add(segment.start);
      validBoundaries.add(segment.end);
    }

    let previousEnd = 0;

    for (const edit of edits) {
      if (
        !Number.isInteger(edit.start) ||
        !Number.isInteger(edit.end) ||
        edit.start < previousEnd ||
        edit.start < 0 ||
        edit.end < edit.start ||
        edit.end > input.length ||
        !validBoundaries.has(edit.start) ||
        !validBoundaries.has(edit.end)
      ) {
        throw new Error("Invalid point text edit range");
      }

      previousEnd = edit.end;
    }

    const resultParts: string[] = [];
    let sourceCursor = 0;

    for (const edit of edits) {
      resultParts.push(input.slice(sourceCursor, edit.start), edit.insertText);
      sourceCursor = edit.end;
    }

    resultParts.push(input.slice(sourceCursor));
    return resultParts.join("");
  } catch (error) {
    console.error("[Чистовик] Failed to apply point text edits to string", error);
    throw error;
  }
}

function coalesceDensePointTextEdits(oldText: string, edits: PointTextEdit[], styles: StyleSegment[]): PointTextEdit[] {
  if (edits.length <= 256) {
    return edits;
  }

  const result: PointTextEdit[] = [];
  let group: PointTextEdit[] = [];
  let groupStyle: StyleSegment | null = null;

  const finishGroup = (): void => {
    if (group.length === 0) {
      return;
    }

    result.push(group.length === 1 ? group[0] : mergePointTextEditGroup(oldText, group));
    group = [];
    groupStyle = null;
  };

  for (const edit of edits) {
    const sourcePosition = edit.insertText === "" ? Math.min(edit.start, Math.max(0, oldText.length - 1)) : getPointTextEditStyleSourcePosition(oldText, edit);
    const style = findStyleSegmentAtPosition(styles, sourcePosition);

    if (style === null || edit.start < style.start || edit.end > style.end) {
      finishGroup();
      result.push(edit);
      continue;
    }

    if (group.length === 0) {
      group = [edit];
      groupStyle = style;
      continue;
    }

    const previousEdit = group[group.length - 1];
    const unchangedGapLength = edit.start - previousEdit.end;

    if (
      style !== groupStyle ||
      unchangedGapLength > 64 ||
      edit.start < previousEdit.end
    ) {
      finishGroup();
      group = [edit];
      groupStyle = style;
      continue;
    }

    group.push(edit);
  }

  finishGroup();
  return result;
}

function findStyleSegmentAtPosition(styles: StyleSegment[], position: number): StyleSegment | null {
  let low = 0;
  let high = styles.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const style = styles[middle];

    if (position < style.start) {
      high = middle;
    } else if (position >= style.end) {
      low = middle + 1;
    } else {
      return style;
    }
  }

  return null;
}

function mergePointTextEditGroup(oldText: string, group: PointTextEdit[]): PointTextEdit {
  const start = group[0].start;
  const end = group[group.length - 1].end;
  const insertParts: string[] = [];
  let sourceCursor = start;

  for (const edit of group) {
    insertParts.push(oldText.slice(sourceCursor, edit.start), edit.insertText);
    sourceCursor = edit.end;
  }

  insertParts.push(oldText.slice(sourceCursor, end));

  return {
    start,
    end,
    insertText: insertParts.join(""),
  };
}

function assertPointTextEditsSafeForCurrentStage(oldText: string, edits: PointTextEdit[], styles: StyleSegment[]): void {
  try {
    for (const edit of edits) {
      if (edit.insertText === "") {
        continue;
      }

      const sourcePosition = getPointTextEditStyleSourcePosition(oldText, edit);
      const sourceStyle = findStyleSegmentAtPosition(styles, sourcePosition);

      if (sourceStyle === null) {
        throw new Error("Point text edit has no safe style source");
      }
    }
  } catch (error) {
    console.error("[Чистовик] Point text edits are not safe for the current stage", error);
    throw error;
  }
}

function buildPointTextEditStyleMap(oldText: string, styles: StyleSegment[], edits: PointTextEdit[]): number[] {
  try {
    const originalStyleMap = new Array<number>(oldText.length).fill(0);

    for (let styleIndex = 0; styleIndex < styles.length; styleIndex += 1) {
      const style = styles[styleIndex];

      for (let characterIndex = style.start; characterIndex < style.end; characterIndex += 1) {
        originalStyleMap[characterIndex] = styleIndex;
      }
    }

    const result: number[] = [];
    let sourceCursor = 0;

    for (const edit of edits) {
      for (let characterIndex = sourceCursor; characterIndex < edit.start; characterIndex += 1) {
        result.push(originalStyleMap[characterIndex] ?? 0);
      }

      let insertedStyles: number[];

      if (edit.start === edit.end) {
        const leadingWhitespaceLength = getPointTextEditLeadingWhitespaceLength(edit.insertText);
        const leftStyleIndex = edit.start > 0 ? originalStyleMap[edit.start - 1] : undefined;
        const rightStyleIndex = edit.start < oldText.length ? originalStyleMap[edit.start] : undefined;
        const defaultStyleIndex = rightStyleIndex ?? leftStyleIndex ?? 0;

        insertedStyles = new Array<number>(edit.insertText.length).fill(defaultStyleIndex);

        if (leftStyleIndex !== undefined && leadingWhitespaceLength > 0) {
          insertedStyles.fill(leftStyleIndex, 0, leadingWhitespaceLength);
        }
      } else {
        const sourcePosition = getPointTextEditStyleSourcePosition(oldText, edit);
        const sourceStyleIndex = originalStyleMap[sourcePosition] ?? 0;
        insertedStyles = new Array<number>(edit.insertText.length).fill(sourceStyleIndex);
      }

      for (const styleIndex of insertedStyles) {
        result.push(styleIndex);
      }

      sourceCursor = edit.end;
    }

    for (let characterIndex = sourceCursor; characterIndex < originalStyleMap.length; characterIndex += 1) {
      result.push(originalStyleMap[characterIndex] ?? 0);
    }

    const newText = applyPointTextEditsToString(oldText, edits);
    const currencyStyleSources = preserveCurrencySymbolStyleSources(
      oldText,
      newText,
      new Array<number>(newText.length).fill(0)
    );

    for (let index = 0; index < newText.length; index += 1) {
      if (QUANTITY_CURRENCY_SYMBOLS.includes(newText[index])) {
        result[index] = originalStyleMap[currencyStyleSources[index]] ?? result[index] ?? 0;
      }
    }

    return result;
  } catch (error) {
    console.error("[Чистовик] Failed to build point text edit style map", error);
    throw error;
  }
}

function createPointTextMutationJournal(expectedText: string): PointTextMutationJournal {
  return {
    canInvert: true,
    expectedText,
    inverseOperations: [],
  };
}

function recordPointMutationResult(
  textNode: TextNode,
  journal: PointTextMutationJournal,
  beforeText: string,
  expectedText: string,
  inverseOperation: PointTextInverseOperation
): void {
  const actualText = textNode.characters;
  journal.expectedText = actualText;

  if (actualText === expectedText) {
    journal.inverseOperations.push(inverseOperation);
  } else if (actualText !== beforeText) {
    journal.canInvert = false;
  }
}

function insertPointTextWithJournal(
  textNode: TextNode,
  start: number,
  text: string,
  useStyle: "AFTER" | "BEFORE",
  journal: PointTextMutationJournal
): void {
  const beforeText = textNode.characters;
  const expectedText = `${beforeText.slice(0, start)}${text}${beforeText.slice(start)}`;

  try {
    textNode.insertCharacters(start, text, useStyle);
  } catch (error) {
    recordPointMutationResult(textNode, journal, beforeText, expectedText, {
      end: start + text.length,
      start,
      type: "delete",
    });
    throw error;
  }

  recordPointMutationResult(textNode, journal, beforeText, expectedText, {
    end: start + text.length,
    start,
    type: "delete",
  });
}

function deletePointTextWithJournal(
  textNode: TextNode,
  start: number,
  end: number,
  journal: PointTextMutationJournal
): void {
  const beforeText = textNode.characters;
  const deletedText = beforeText.slice(start, end);
  const expectedText = `${beforeText.slice(0, start)}${beforeText.slice(end)}`;
  const inverseOperation: PointTextInverseOperation = {
    start,
    text: deletedText,
    type: "insert",
    useStyle: start < expectedText.length ? "AFTER" : "BEFORE",
  };

  try {
    textNode.deleteCharacters(start, end);
  } catch (error) {
    recordPointMutationResult(textNode, journal, beforeText, expectedText, inverseOperation);
    throw error;
  }

  recordPointMutationResult(textNode, journal, beforeText, expectedText, inverseOperation);
}

function applyInversePointTextMutations(textNode: TextNode, journal: PointTextMutationJournal): void {
  if (!journal.canInvert || textNode.characters !== journal.expectedText) {
    throw new Error("Point text rollback cannot safely identify the plugin changes");
  }

  for (let operationIndex = journal.inverseOperations.length - 1; operationIndex >= 0; operationIndex -= 1) {
    const operation = journal.inverseOperations[operationIndex];

    if (operation.type === "delete") {
      textNode.deleteCharacters(operation.start, operation.end ?? operation.start);
    } else {
      textNode.insertCharacters(operation.start, operation.text ?? "", operation.useStyle ?? "BEFORE");
    }
  }
}

function applyPointTextEditsToTextNode(
  textNode: TextNode,
  edits: PointTextEdit[],
  mutationJournal: PointTextMutationJournal = createPointTextMutationJournal(textNode.characters)
): void {
  try {
    const originalText = textNode.characters;

    for (let editIndex = edits.length - 1; editIndex >= 0; editIndex -= 1) {
      const edit = edits[editIndex];
      if (edit.insertText === "") {
        deletePointTextWithJournal(textNode, edit.start, edit.end, mutationJournal);
        continue;
      }

      if (edit.start === edit.end) {
        const leadingWhitespaceLength = getPointTextEditLeadingWhitespaceLength(edit.insertText);
        const hasTextBefore = edit.start > 0;
        const hasTextAfter = edit.start < originalText.length;

        if (
          hasTextBefore &&
          hasTextAfter &&
          leadingWhitespaceLength > 0 &&
          leadingWhitespaceLength < edit.insertText.length
        ) {
          insertPointTextWithJournal(textNode, edit.start, edit.insertText.slice(leadingWhitespaceLength), "AFTER", mutationJournal);
          insertPointTextWithJournal(textNode, edit.start, edit.insertText.slice(0, leadingWhitespaceLength), "BEFORE", mutationJournal);
        } else {
          const whitespaceShouldUseLeftStyle = hasTextBefore && leadingWhitespaceLength === edit.insertText.length;
          const useStyle = hasTextAfter && !whitespaceShouldUseLeftStyle ? "AFTER" : "BEFORE";
          insertPointTextWithJournal(textNode, edit.start, edit.insertText, useStyle, mutationJournal);
        }

        continue;
      }

      const sourcePosition = getPointTextEditStyleSourcePosition(originalText, edit);
      insertPointTextWithJournal(textNode, sourcePosition, edit.insertText, "AFTER", mutationJournal);
      deletePointTextWithJournal(
        textNode,
        sourcePosition + edit.insertText.length,
        edit.end + edit.insertText.length,
        mutationJournal
      );

      if (edit.start < sourcePosition) {
        deletePointTextWithJournal(textNode, edit.start, sourcePosition, mutationJournal);
      }
    }
  } catch (error) {
    console.error(`[Чистовик] Failed to apply point text edits to text node ${textNode.id}`, error);
    throw error;
  }
}

function getPointTextEditLeadingWhitespaceLength(insertText: string): number {
  try {
    return insertText.match(/^[ \t\r\n\u00A0]+/)?.[0].length ?? 0;
  } catch (error) {
    console.error("[Чистовик] Failed to inspect point text insertion", error);
    throw error;
  }
}

function getPointTextEditStyleSourcePosition(oldText: string, edit: PointTextEdit): number {
  try {
    if (oldText.length === 0) {
      throw new Error("Empty text has no style source");
    }

    if (edit.start === edit.end) {
      return edit.start < oldText.length ? edit.start : oldText.length - 1;
    }

    const replacedText = oldText.slice(edit.start, edit.end);
    const meaningfulSegment = segmentTextForPointEdits(replacedText).find((segment) => !/^[ \t\r\n\u00A0]+$/.test(segment.text));
    return edit.start + (meaningfulSegment?.start ?? 0);
  } catch (error) {
    console.error("[Чистовик] Failed to choose a style source for point text edit", error);
    throw error;
  }
}

function segmentTextForPointEdits(input: string): PointEditTextSegment[] {
  try {
    const segmenterConstructor =
      typeof Intl === "undefined"
        ? undefined
        : (Intl as unknown as {
            Segmenter?: new (
              locale?: string | string[],
              options?: { granularity: "grapheme" }
            ) => { segment: (value: string) => Iterable<{ index: number; segment: string }> };
          }).Segmenter;

    if (typeof segmenterConstructor === "function") {
      const segments: PointEditTextSegment[] = [];
      const segmenter = new segmenterConstructor(undefined, { granularity: "grapheme" });

      for (const part of segmenter.segment(input)) {
        segments.push({
          start: part.index,
          end: part.index + part.segment.length,
          text: part.segment,
        });
      }

      return segments;
    }

    return segmentTextForPointEditsFallback(input);
  } catch (error) {
    console.error("[Чистовик] Failed to segment text for point edits", error);
    throw error;
  }
}

function segmentTextForPointEditsFallback(input: string): PointEditTextSegment[] {
  const codePoints: PointEditTextSegment[] = [];
  let offset = 0;

  for (const text of Array.from(input)) {
    codePoints.push({ start: offset, end: offset + text.length, text });
    offset += text.length;
  }

  const segments: PointEditTextSegment[] = [];

  for (let index = 0; index < codePoints.length; index += 1) {
    const first = codePoints[index];
    let end = first.end;
    let text = first.text;
    let regionalIndicators = isRegionalIndicator(first.text) ? 1 : 0;

    while (index + 1 < codePoints.length) {
      const next = codePoints[index + 1];

      if (first.text === "\r" && text === "\r" && next.text === "\n") {
        text += next.text;
        end = next.end;
        index += 1;
        continue;
      }

      if (
        isGraphemeExtender(next.text) ||
        shouldJoinHangulGraphemes(text, next.text) ||
        endsWithIndicVirama(text) ||
        (regionalIndicators === 1 && isRegionalIndicator(next.text))
      ) {
        text += next.text;
        end = next.end;
        regionalIndicators += isRegionalIndicator(next.text) ? 1 : 0;
        index += 1;
        continue;
      }

      if (next.text === "\u200D" && index + 2 < codePoints.length) {
        const joined = codePoints[index + 2];
        text += `${next.text}${joined.text}`;
        end = joined.end;
        index += 2;
        continue;
      }

      break;
    }

    segments.push({ start: first.start, end, text });
  }

  return segments;
}

function isGraphemeExtender(text: string): boolean {
  const codePoint = text.codePointAt(0) ?? 0;
  return (
    isUnicodeMark(text) ||
    isIndicScriptMark(codePoint) ||
    isIndicViramaCodePoint(codePoint) ||
    (codePoint >= 0x0300 && codePoint <= 0x036f) ||
    (codePoint >= 0x1ab0 && codePoint <= 0x1aff) ||
    (codePoint >= 0x1dc0 && codePoint <= 0x1dff) ||
    (codePoint >= 0x20d0 && codePoint <= 0x20ff) ||
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
    (codePoint >= 0xfe20 && codePoint <= 0xfe2f) ||
    (codePoint >= 0x1f3fb && codePoint <= 0x1f3ff) ||
    (codePoint >= 0xe0020 && codePoint <= 0xe007f) ||
    (codePoint >= 0xe0100 && codePoint <= 0xe01ef)
  );
}

function isIndicScriptMark(codePoint: number): boolean {
  return (
    (codePoint >= 0x0900 && codePoint <= 0x0903) ||
    (codePoint >= 0x093a && codePoint <= 0x094f) ||
    (codePoint >= 0x0951 && codePoint <= 0x0957) ||
    (codePoint >= 0x0962 && codePoint <= 0x0963) ||
    (codePoint >= 0x0981 && codePoint <= 0x0983) ||
    codePoint === 0x09bc ||
    (codePoint >= 0x09be && codePoint <= 0x09c4) ||
    (codePoint >= 0x09c7 && codePoint <= 0x09c8) ||
    (codePoint >= 0x09cb && codePoint <= 0x09cd) ||
    codePoint === 0x09d7 ||
    (codePoint >= 0x0a01 && codePoint <= 0x0a03) ||
    (codePoint >= 0x0a3c && codePoint <= 0x0a4d) ||
    (codePoint >= 0x0a70 && codePoint <= 0x0a71) ||
    (codePoint >= 0x0a81 && codePoint <= 0x0a83) ||
    (codePoint >= 0x0abc && codePoint <= 0x0acd) ||
    (codePoint >= 0x0b01 && codePoint <= 0x0b03) ||
    (codePoint >= 0x0b3c && codePoint <= 0x0b4d) ||
    codePoint === 0x0b56 ||
    codePoint === 0x0b57 ||
    (codePoint >= 0x0b82 && codePoint <= 0x0b83) ||
    (codePoint >= 0x0bbe && codePoint <= 0x0bcd) ||
    codePoint === 0x0bd7 ||
    (codePoint >= 0x0c00 && codePoint <= 0x0c04) ||
    (codePoint >= 0x0c3c && codePoint <= 0x0c4d) ||
    (codePoint >= 0x0c55 && codePoint <= 0x0c56) ||
    (codePoint >= 0x0c81 && codePoint <= 0x0c83) ||
    (codePoint >= 0x0cbc && codePoint <= 0x0ccd) ||
    (codePoint >= 0x0d00 && codePoint <= 0x0d03) ||
    (codePoint >= 0x0d3b && codePoint <= 0x0d4d) ||
    codePoint === 0x0d57 ||
    (codePoint >= 0x0d81 && codePoint <= 0x0d83) ||
    (codePoint >= 0x0dca && codePoint <= 0x0dd4) ||
    codePoint === 0x0dd6 ||
    (codePoint >= 0x0dd8 && codePoint <= 0x0ddf)
  );
}

function isUnicodeMark(text: string): boolean {
  if (unicodeMarkPattern === undefined) {
    try {
      unicodeMarkPattern = new RegExp("^\\p{M}$", "u");
    } catch {
      unicodeMarkPattern = null;
    }
  }

  return unicodeMarkPattern?.test(text) ?? false;
}

function shouldJoinHangulGraphemes(currentText: string, nextText: string): boolean {
  const currentCodePoint = Array.from(currentText).pop()?.codePointAt(0) ?? 0;
  const nextCodePoint = nextText.codePointAt(0) ?? 0;
  const currentType = getHangulGraphemeType(currentCodePoint);
  const nextType = getHangulGraphemeType(nextCodePoint);

  return (
    (currentType === "L" && (nextType === "L" || nextType === "V" || nextType === "LV" || nextType === "LVT")) ||
    ((currentType === "LV" || currentType === "V") && (nextType === "V" || nextType === "T")) ||
    ((currentType === "LVT" || currentType === "T") && nextType === "T")
  );
}

function getHangulGraphemeType(codePoint: number): "L" | "V" | "T" | "LV" | "LVT" | null {
  if (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||
    (codePoint >= 0xa960 && codePoint <= 0xa97c)
  ) {
    return "L";
  }

  if (
    (codePoint >= 0x1160 && codePoint <= 0x11a7) ||
    (codePoint >= 0xd7b0 && codePoint <= 0xd7c6)
  ) {
    return "V";
  }

  if (
    (codePoint >= 0x11a8 && codePoint <= 0x11ff) ||
    (codePoint >= 0xd7cb && codePoint <= 0xd7fb)
  ) {
    return "T";
  }

  if (codePoint >= 0xac00 && codePoint <= 0xd7a3) {
    return (codePoint - 0xac00) % 28 === 0 ? "LV" : "LVT";
  }

  return null;
}

function endsWithIndicVirama(text: string): boolean {
  const codePoint = Array.from(text).pop()?.codePointAt(0) ?? 0;
  return isIndicViramaCodePoint(codePoint);
}

function isIndicViramaCodePoint(codePoint: number): boolean {
  return [
    0x094d, 0x09cd, 0x0a4d, 0x0acd, 0x0b4d, 0x0bcd, 0x0c4d, 0x0ccd, 0x0d3b, 0x0d3c, 0x0d4d,
    0x0dca, 0x0e3a, 0x0f84, 0x1039, 0x103a, 0x1714, 0x1734, 0x17d2, 0x1a60, 0x1b44, 0x1baa, 0x1bab,
    0x1bf2, 0x1bf3, 0x2d7f, 0xa806, 0xa82c, 0xa8c4, 0xa953, 0xa9c0, 0xaaf6, 0xabed, 0x10a3f, 0x11046,
    0x11070, 0x11133, 0x11134, 0x111c0, 0x11235, 0x112ea, 0x1134d, 0x11442, 0x114c2, 0x115bf, 0x1163f,
    0x116b6, 0x1172b, 0x11839, 0x1193d, 0x1193e, 0x119e0, 0x11a34, 0x11a47, 0x11a99, 0x11c3f, 0x11d44,
    0x11d45, 0x11d97, 0x16af0, 0x16b44, 0x16d6c,
  ].includes(codePoint);
}

function isRegionalIndicator(text: string): boolean {
  const codePoint = text.codePointAt(0) ?? 0;
  return codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff;
}

function getPointEditBoundary(segments: PointEditTextSegment[], segmentIndex: number, textLength: number): number {
  if (segmentIndex < segments.length) {
    return segments[segmentIndex].start;
  }

  return segments.length > 0 ? segments[segments.length - 1].end : textLength;
}

function buildPointEditDiffSteps(oldParts: string[], newParts: string[]): PointEditDiffStep[] | null {
  try {
    if (oldParts.length + newParts.length > 4096) {
      return buildLocalPointEditDiffSteps(oldParts, newParts);
    }

    const steps: PointEditDiffStep[] = [];
    appendPointEditDiffSteps(oldParts, newParts, 0, oldParts.length, 0, newParts.length, steps);
    return steps;
  } catch (error) {
    console.error("[Чистовик] Failed to build point edit diff", error);
    return null;
  }
}

function buildLocalPointEditDiffSteps(oldParts: string[], newParts: string[]): PointEditDiffStep[] | null {
  const steps: PointEditDiffStep[] = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldParts.length || newIndex < newParts.length) {
    if (oldIndex < oldParts.length && newIndex < newParts.length && oldParts[oldIndex] === newParts[newIndex]) {
      steps.push({ type: "equal", text: oldParts[oldIndex] });
      oldIndex += 1;
      newIndex += 1;
      continue;
    }

    if (oldIndex === oldParts.length) {
      for (; newIndex < newParts.length; newIndex += 1) {
        steps.push({ type: "insert", text: newParts[newIndex] });
      }

      break;
    }

    if (newIndex === newParts.length) {
      for (; oldIndex < oldParts.length; oldIndex += 1) {
        steps.push({ type: "delete", text: oldParts[oldIndex] });
      }

      break;
    }

    const alignment = findLocalPointEditAlignment(oldParts, newParts, oldIndex, newIndex);

    if (alignment === null) {
      if (oldParts.length - oldIndex <= 32 && newParts.length - newIndex <= 32) {
        for (; oldIndex < oldParts.length; oldIndex += 1) {
          steps.push({ type: "delete", text: oldParts[oldIndex] });
        }

        for (; newIndex < newParts.length; newIndex += 1) {
          steps.push({ type: "insert", text: newParts[newIndex] });
        }

        break;
      }

      return null;
    }

    for (; oldIndex < alignment.oldIndex; oldIndex += 1) {
      steps.push({ type: "delete", text: oldParts[oldIndex] });
    }

    for (; newIndex < alignment.newIndex; newIndex += 1) {
      steps.push({ type: "insert", text: newParts[newIndex] });
    }
  }

  return steps;
}

function findLocalPointEditAlignment(
  oldParts: string[],
  newParts: string[],
  oldStart: number,
  newStart: number
): { oldIndex: number; newIndex: number } | null {
  const lookahead = 32;
  const maxOldOffset = Math.min(lookahead, oldParts.length - oldStart - 1);
  const maxNewOffset = Math.min(lookahead, newParts.length - newStart - 1);

  // The former implementation inspected the complete 33 × 33 square and
  // then selected the smallest total distance. Inspecting diagonals from the
  // nearest to the farthest returns the exact same answer and can stop as soon
  // as that answer is found. Within one diagonal the old-text offset stays in
  // the same ascending order as in the former nested loops.
  for (let score = 1; score <= maxOldOffset + maxNewOffset; score += 1) {
    const firstOldOffset = Math.max(0, score - maxNewOffset);
    const lastOldOffset = Math.min(maxOldOffset, score);

    for (let oldOffset = firstOldOffset; oldOffset <= lastOldOffset; oldOffset += 1) {
      const newOffset = score - oldOffset;
      const oldCandidate = oldStart + oldOffset;
      const newCandidate = newStart + newOffset;

      if (
        oldParts[oldCandidate] === newParts[newCandidate] &&
        hasStablePointEditAnchor(oldParts, newParts, oldCandidate, newCandidate)
      ) {
        return { oldIndex: oldCandidate, newIndex: newCandidate };
      }
    }
  }

  return null;
}

function hasStablePointEditAnchor(oldParts: string[], newParts: string[], oldStart: number, newStart: number): boolean {
  const availableLength = Math.min(oldParts.length - oldStart, newParts.length - newStart);
  const requiredLength = Math.min(4, availableLength);

  if (requiredLength === 0) {
    return false;
  }

  for (let offset = 0; offset < requiredLength; offset += 1) {
    if (oldParts[oldStart + offset] !== newParts[newStart + offset]) {
      return false;
    }
  }

  return true;
}

function appendPointEditDiffSteps(
  oldParts: string[],
  newParts: string[],
  oldStart: number,
  oldEnd: number,
  newStart: number,
  newEnd: number,
  steps: PointEditDiffStep[]
): void {
  while (oldStart < oldEnd && newStart < newEnd && oldParts[oldStart] === newParts[newStart]) {
    steps.push({ type: "equal", text: oldParts[oldStart] });
    oldStart += 1;
    newStart += 1;
  }

  let commonSuffixLength = 0;

  while (
    oldStart < oldEnd - commonSuffixLength &&
    newStart < newEnd - commonSuffixLength &&
    oldParts[oldEnd - commonSuffixLength - 1] === newParts[newEnd - commonSuffixLength - 1]
  ) {
    commonSuffixLength += 1;
  }

  const oldMiddleEnd = oldEnd - commonSuffixLength;
  const newMiddleEnd = newEnd - commonSuffixLength;

  if (oldStart === oldMiddleEnd) {
    for (let index = newStart; index < newMiddleEnd; index += 1) {
      steps.push({ type: "insert", text: newParts[index] });
    }
  } else if (newStart === newMiddleEnd) {
    for (let index = oldStart; index < oldMiddleEnd; index += 1) {
      steps.push({ type: "delete", text: oldParts[index] });
    }
  } else if (oldMiddleEnd - oldStart === 1 || newMiddleEnd - newStart === 1) {
    appendSmallPointEditDiffSteps(oldParts, newParts, oldStart, oldMiddleEnd, newStart, newMiddleEnd, steps);
  } else {
    const split = findPointEditBisectSplit(oldParts, newParts, oldStart, oldMiddleEnd, newStart, newMiddleEnd);

    if (
      split === null ||
      (split.oldIndex === oldStart && split.newIndex === newStart) ||
      (split.oldIndex === oldMiddleEnd && split.newIndex === newMiddleEnd)
    ) {
      appendPointEditReplacementSteps(oldParts, newParts, oldStart, oldMiddleEnd, newStart, newMiddleEnd, steps);
    } else {
      appendPointEditDiffSteps(oldParts, newParts, oldStart, split.oldIndex, newStart, split.newIndex, steps);
      appendPointEditDiffSteps(oldParts, newParts, split.oldIndex, oldMiddleEnd, split.newIndex, newMiddleEnd, steps);
    }
  }

  for (let index = commonSuffixLength; index > 0; index -= 1) {
    steps.push({ type: "equal", text: oldParts[oldEnd - index] });
  }
}

function appendSmallPointEditDiffSteps(
  oldParts: string[],
  newParts: string[],
  oldStart: number,
  oldEnd: number,
  newStart: number,
  newEnd: number,
  steps: PointEditDiffStep[]
): void {
  if (oldEnd - oldStart === 1) {
    const sharedNewIndex = newParts.indexOf(oldParts[oldStart], newStart);

    if (sharedNewIndex >= newStart && sharedNewIndex < newEnd) {
      for (let index = newStart; index < sharedNewIndex; index += 1) {
        steps.push({ type: "insert", text: newParts[index] });
      }

      steps.push({ type: "equal", text: oldParts[oldStart] });

      for (let index = sharedNewIndex + 1; index < newEnd; index += 1) {
        steps.push({ type: "insert", text: newParts[index] });
      }

      return;
    }
  } else if (newEnd - newStart === 1) {
    const sharedOldIndex = oldParts.indexOf(newParts[newStart], oldStart);

    if (sharedOldIndex >= oldStart && sharedOldIndex < oldEnd) {
      for (let index = oldStart; index < sharedOldIndex; index += 1) {
        steps.push({ type: "delete", text: oldParts[index] });
      }

      steps.push({ type: "equal", text: newParts[newStart] });

      for (let index = sharedOldIndex + 1; index < oldEnd; index += 1) {
        steps.push({ type: "delete", text: oldParts[index] });
      }

      return;
    }
  }

  appendPointEditReplacementSteps(oldParts, newParts, oldStart, oldEnd, newStart, newEnd, steps);
}

function appendPointEditReplacementSteps(
  oldParts: string[],
  newParts: string[],
  oldStart: number,
  oldEnd: number,
  newStart: number,
  newEnd: number,
  steps: PointEditDiffStep[]
): void {
  for (let index = oldStart; index < oldEnd; index += 1) {
    steps.push({ type: "delete", text: oldParts[index] });
  }

  for (let index = newStart; index < newEnd; index += 1) {
    steps.push({ type: "insert", text: newParts[index] });
  }
}

function findPointEditBisectSplit(
  oldParts: string[],
  newParts: string[],
  oldStart: number,
  oldEnd: number,
  newStart: number,
  newEnd: number
): { oldIndex: number; newIndex: number } | null {
  const oldLength = oldEnd - oldStart;
  const newLength = newEnd - newStart;
  const maximumDistance = Math.ceil((oldLength + newLength) / 2);
  const vectorOffset = maximumDistance + 1;
  const vectorLength = vectorOffset * 2 + 1;
  const forward = new Int32Array(vectorLength);
  const backward = new Int32Array(vectorLength);
  forward.fill(-1);
  backward.fill(-1);
  forward[vectorOffset + 1] = 0;
  backward[vectorOffset + 1] = 0;
  const delta = oldLength - newLength;
  const overlapsOnForwardPass = delta % 2 !== 0;
  let forwardStart = 0;
  let forwardEnd = 0;
  let backwardStart = 0;
  let backwardEnd = 0;

  for (let distance = 0; distance <= maximumDistance; distance += 1) {
    for (let diagonal = -distance + forwardStart; diagonal <= distance - forwardEnd; diagonal += 2) {
      const vectorIndex = vectorOffset + diagonal;
      let oldIndex =
        diagonal === -distance || (diagonal !== distance && forward[vectorIndex - 1] < forward[vectorIndex + 1])
          ? forward[vectorIndex + 1]
          : forward[vectorIndex - 1] + 1;
      let newIndex = oldIndex - diagonal;

      while (
        oldIndex < oldLength &&
        newIndex < newLength &&
        oldParts[oldStart + oldIndex] === newParts[newStart + newIndex]
      ) {
        oldIndex += 1;
        newIndex += 1;
      }

      forward[vectorIndex] = oldIndex;

      if (oldIndex > oldLength) {
        forwardEnd += 2;
      } else if (newIndex > newLength) {
        forwardStart += 2;
      } else if (overlapsOnForwardPass) {
        const backwardIndex = vectorOffset + delta - diagonal;

        if (backwardIndex >= 0 && backwardIndex < vectorLength && backward[backwardIndex] !== -1) {
          const backwardOldIndex = oldLength - backward[backwardIndex];

          if (oldIndex >= backwardOldIndex) {
            return { oldIndex: oldStart + oldIndex, newIndex: newStart + newIndex };
          }
        }
      }
    }

    for (let diagonal = -distance + backwardStart; diagonal <= distance - backwardEnd; diagonal += 2) {
      const vectorIndex = vectorOffset + diagonal;
      let oldIndex =
        diagonal === -distance || (diagonal !== distance && backward[vectorIndex - 1] < backward[vectorIndex + 1])
          ? backward[vectorIndex + 1]
          : backward[vectorIndex - 1] + 1;
      let newIndex = oldIndex - diagonal;

      while (
        oldIndex < oldLength &&
        newIndex < newLength &&
        oldParts[oldEnd - oldIndex - 1] === newParts[newEnd - newIndex - 1]
      ) {
        oldIndex += 1;
        newIndex += 1;
      }

      backward[vectorIndex] = oldIndex;

      if (oldIndex > oldLength) {
        backwardEnd += 2;
      } else if (newIndex > newLength) {
        backwardStart += 2;
      } else if (!overlapsOnForwardPass) {
        const forwardDiagonal = delta - diagonal;
        const forwardIndex = vectorOffset + forwardDiagonal;

        if (forwardIndex >= 0 && forwardIndex < vectorLength && forward[forwardIndex] !== -1) {
          const forwardOldIndex = forward[forwardIndex];
          const backwardOldIndex = oldLength - oldIndex;

          if (forwardOldIndex >= backwardOldIndex) {
            return {
              oldIndex: oldStart + forwardOldIndex,
              newIndex: newStart + forwardOldIndex - forwardDiagonal,
            };
          }
        }
      }
    }
  }

  return null;
}

function pointEditDiffStepsToEdits(diffSteps: PointEditDiffStep[], oldSegments: PointEditTextSegment[], middleStart: number): PointTextEdit[] {
  const edits: PointTextEdit[] = [];
  let oldIndex = 0;
  let editStartOldIndex: number | null = null;
  let insertText = "";

  const getOldBoundary = (index: number): number => {
    if (index < oldSegments.length) {
      return oldSegments[index].start;
    }

    return oldSegments.length > 0 ? oldSegments[oldSegments.length - 1].end : middleStart;
  };

  const finishEdit = (): void => {
    if (editStartOldIndex === null) {
      return;
    }

    edits.push({
      start: getOldBoundary(editStartOldIndex),
      end: getOldBoundary(oldIndex),
      insertText,
    });
    editStartOldIndex = null;
    insertText = "";
  };

  for (const step of diffSteps) {
    if (step.type === "equal") {
      finishEdit();
      oldIndex += 1;
      continue;
    }

    if (editStartOldIndex === null) {
      editStartOldIndex = oldIndex;
    }

    if (step.type === "delete") {
      oldIndex += 1;
    } else {
      insertText += step.text;
    }
  }

  finishEdit();
  return edits;
}

function cleanTypography(input: string, options: PluginRunOptions = getDefaultRunOptions()): string {
  try {
    return cleanTypographyWithMetadata(input, options).text;
  } catch (error) {
    console.error("[Чистовик] Failed to clean text", error);
    throw error;
  }
}

function cleanTypographyWithMetadata(
  input: string,
  options: PluginRunOptions = getDefaultRunOptions(),
  existingDevelopmentMarkerIndexes: number[] = [],
  ruleAnalyticsCollector: TypographyRuleAnalyticsCollector | null = null,
  numberLayerContext: NumberLayerContext | null = null
): TypographyCleanResult {
  try {
    const normalizedInput = normalizeInputNonBreakingSpaces(input);
    const asteriskSpaceCandidateIndexes = getExistingAsteriskSpaceCandidateIndexesForRun(normalizedInput, options);
    const markerIndexes = getDevelopmentMarkerIndexesForRun(normalizedInput, options, existingDevelopmentMarkerIndexes, asteriskSpaceCandidateIndexes);
    const inputWithKnownMarkers = restoreExistingDevelopmentMarkers(normalizedInput, [...markerIndexes, ...asteriskSpaceCandidateIndexes]);
    const beautyInput = restoreStableDevelopmentPatternMarkers(inputWithKnownMarkers);
    const beautyText = cleanTypographyForBeauty(beautyInput, ruleAnalyticsCollector, numberLayerContext);

    if (options.mode !== "development") {
      return {
        text: beautyText,
        developmentMarkerIndexes: [],
      };
    }

    return createDevelopmentTypographyResult(beautyText);
  } catch (error) {
    console.error("[Чистовик] Failed to clean text with metadata", error);
    throw error;
  }
}

function getExistingAsteriskSpaceCandidateIndexesForRun(input: string, options: PluginRunOptions): number[] {
  try {
    if (options.mode !== "development" || !options.recolorExistingAsterisks) {
      return [];
    }

    return getExistingAsteriskSpaceCandidateIndexes(input);
  } catch (error) {
    console.error("[Чистовик] Failed to get existing asterisk space candidate indexes for run", error);
    throw error;
  }
}

function getDevelopmentMarkerIndexesForRun(input: string, options: PluginRunOptions, existingDevelopmentMarkerIndexes: number[], asteriskSpaceCandidateIndexes: number[]): number[] {
  try {
    const markerIndexes = new Set<number>(existingDevelopmentMarkerIndexes);

    if (options.mode === "development" && options.recolorExistingAsterisks) {
      for (const index of getExistingAsteriskIndexesMatchingNonBreakingSpaces(input, asteriskSpaceCandidateIndexes)) {
        markerIndexes.add(index);
      }
    }

    return Array.from(markerIndexes).sort((first, second) => first - second);
  } catch (error) {
    console.error("[Чистовик] Failed to get development marker indexes for run", error);
    throw error;
  }
}

function getExistingAsteriskIndexesMatchingNonBreakingSpaces(input: string, asteriskSpaceCandidateIndexes: number[]): number[] {
  try {
    if (asteriskSpaceCandidateIndexes.length === 0) {
      return [];
    }

    const candidateIndexSet = new Set<number>(asteriskSpaceCandidateIndexes);
    const candidateInput = input
      .split("")
      .map((char, index) => (char === DEVELOPMENT_NBSP_MARKER && candidateIndexSet.has(index) ? " " : char))
      .join("");
    const candidateBeautyText = cleanTypographyForBeauty(restoreStableDevelopmentPatternMarkers(candidateInput));
    const candidateResult = createDevelopmentTypographyResult(candidateBeautyText);
    const indexes: number[] = [];

    for (const index of candidateResult.developmentMarkerIndexes) {
      if (candidateIndexSet.has(index) && input[index] === DEVELOPMENT_NBSP_MARKER && candidateResult.text[index] === DEVELOPMENT_NBSP_MARKER) {
        indexes.push(index);
      }
    }

    return indexes;
  } catch (error) {
    console.error("[Чистовик] Failed to get existing asterisk indexes matching non-breaking spaces", error);
    throw error;
  }
}

function getExistingAsteriskSpaceCandidateIndexes(input: string): number[] {
  try {
    const indexes: number[] = [];
    let index = input.indexOf(DEVELOPMENT_NBSP_MARKER);

    while (index !== -1) {
      if (isSafeAsteriskSpaceCandidate(input, index)) {
        indexes.push(index);
      }

      index = input.indexOf(DEVELOPMENT_NBSP_MARKER, index + 1);
    }

    return indexes;
  } catch (error) {
    console.error("[Чистовик] Failed to get existing asterisk space candidate indexes", error);
    throw error;
  }
}

function isSafeAsteriskSpaceCandidate(input: string, index: number): boolean {
  try {
    if (!isIsolatedAsterisk(input, index) || isUnsafeAsteriskSpaceCandidate(input, index)) {
      return false;
    }

    const previous = input[index - 1] ?? "";
    const next = input[index + 1] ?? "";

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
  } catch (error) {
    console.error("[Чистовик] Failed to check safe asterisk space candidate", error);
    throw error;
  }
}

function isUnsafeAsteriskSpaceCandidate(input: string, index: number): boolean {
  try {
    const previous = input[index - 1] ?? "";
    const next = input[index + 1] ?? "";

    if (/\d/.test(previous) && /\d/.test(next)) {
      return true;
    }

    const bounds = getLooseTokenBounds(input, index, index + 1);
    const token = input.slice(bounds.start, bounds.end);

    return isMaskedSecretToken(token) || /[A-Za-z]/.test(token) || token.includes("@") || token.includes("_");
  } catch (error) {
    console.error("[Чистовик] Failed to check unsafe asterisk space candidate", error);
    throw error;
  }
}

function isIsolatedAsterisk(input: string, index: number): boolean {
  try {
    return input[index - 1] !== DEVELOPMENT_NBSP_MARKER && input[index + 1] !== DEVELOPMENT_NBSP_MARKER;
  } catch (error) {
    console.error("[Чистовик] Failed to check isolated asterisk", error);
    throw error;
  }
}

function restoreStableDevelopmentPatternMarkers(input: string): string {
  try {
    if (!input.includes(DEVELOPMENT_NBSP_MARKER)) {
      return input;
    }

    const chars = input.split("");
    restoreDevelopmentCopyrightYearMarkers(chars, input);
    restoreDevelopmentPhoneMarkers(chars, input);
    restoreDevelopmentGroupedNumberMarkers(chars, input);

    return chars.join("");
  } catch (error) {
    console.error("[Чистовик] Failed to restore stable development pattern markers", error);
    throw error;
  }
}

function restoreDevelopmentCopyrightYearMarkers(chars: string[], input: string): void {
  try {
    const copyrightYearCandidate = /(©|\(c\))[\* \t\u00A0]*([12])\*(\d{3})\b/gi;

    input.replace(copyrightYearCandidate, (match: string, _copyright: string, _thousand: string, _rest: string, offset: number) => {
      try {
        restoreStarsInRange(chars, offset, offset + match.length);
        return match;
      } catch (error) {
        console.error("[Чистовик] Failed to restore development copyright year markers", error);
        return match;
      }
    });
  } catch (error) {
    console.error("[Чистовик] Failed to restore development copyright year markers", error);
    throw error;
  }
}

function restoreDevelopmentPhoneMarkers(chars: string[], input: string): void {
  try {
    const phoneCandidate = /(^|[^\d])(\+?[78](?:[\* \t\u00A0().\-–—‑]*\d){10})(?![\* \t\u00A0().\-–—‑]*\d)(?![\* \t\u00A0]*[₽$€])/g;

    input.replace(phoneCandidate, (match, prefix: string, candidate: string, offset: number, fullText: string) => {
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
      } catch (error) {
        console.error("[Чистовик] Failed to restore development phone markers", error);
        return match;
      }
    });
  } catch (error) {
    console.error("[Чистовик] Failed to restore development phone markers", error);
    throw error;
  }
}

function restoreDevelopmentGroupedNumberMarkers(chars: string[], input: string): void {
  try {
    const groupedNumberCandidate = /(^|[^\d])(\d{1,3}(?:\*\d{3})+(?:,\d+)?)(\*[₽$€])?/g;

    input.replace(groupedNumberCandidate, (match, prefix: string, number: string, currency: string | undefined, offset: number, fullText: string) => {
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

        restoreStarsInRange(chars, numberStart, numberStart + number.length + (currency?.length ?? 0));
        return match;
      } catch (error) {
        console.error("[Чистовик] Failed to restore development grouped number markers", error);
        return match;
      }
    });
  } catch (error) {
    console.error("[Чистовик] Failed to restore development grouped number markers", error);
    throw error;
  }
}

function restoreStarsInRange(chars: string[], start: number, end: number): void {
  try {
    for (let index = start; index < end; index += 1) {
      if (chars[index] === DEVELOPMENT_NBSP_MARKER) {
        chars[index] = " ";
      }
    }
  } catch (error) {
    console.error("[Чистовик] Failed to restore stars in range", error);
    throw error;
  }
}

function createDevelopmentTypographyResult(beautyText: string): TypographyCleanResult {
  try {
    let text = "";
    const developmentMarkerIndexes: number[] = [];

    for (let index = 0; index < beautyText.length; index += 1) {
      if (beautyText[index] === NBSP) {
        developmentMarkerIndexes.push(index);
        text += DEVELOPMENT_NBSP_MARKER;
      } else {
        text += beautyText[index];
      }
    }

    return { text, developmentMarkerIndexes };
  } catch (error) {
    console.error("[Чистовик] Failed to create development typography result", error);
    throw error;
  }
}

function cleanTypographyForBeauty(input: string, ruleAnalyticsCollector: TypographyRuleAnalyticsCollector | null = null, numberLayerContext: NumberLayerContext | null = null): string {
  try {
    let text = input;

    text = cleanupSpaces(text, ruleAnalyticsCollector);
    text = cleanupQuotesAndPunctuation(text, ruleAnalyticsCollector);
    text = normalizeMathAndSymbols(text, ruleAnalyticsCollector);
    text = cleanupDashesAndHyphens(text, ruleAnalyticsCollector);
    text = formatNumbersAndMoney(text, ruleAnalyticsCollector, numberLayerContext);
    text = formatPhoneNumbers(text, ruleAnalyticsCollector, numberLayerContext);
    text = applyTypographyRule(ruleAnalyticsCollector, "number_unit_currency_nbsp", text, moveLeadingCurrencySymbolsAfterQuantity);
    text = normalizeEditorialRanges(text, ruleAnalyticsCollector);
    text = normalizeAbbreviations(text, ruleAnalyticsCollector);
    text = applyNonBreakingSpaces(text, ruleAnalyticsCollector);
    text = normalizeMathAndSymbols(text, ruleAnalyticsCollector);
    text = applyTypographyRule(ruleAnalyticsCollector, "year_context", text, normalizeSpacedYears);

    return text;
  } catch (error) {
    console.error("[Чистовик] Failed to clean text for beauty mode", error);
    throw error;
  }
}

function restoreExistingDevelopmentMarkers(input: string, markerIndexes: number[]): string {
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
  } catch (error) {
    console.error("[Чистовик] Failed to restore existing development markers", error);
    throw error;
  }
}

function normalizeInputNonBreakingSpaces(input: string): string {
  try {
    return input.replace(/\u00A0/g, " ");
  } catch (error) {
    console.error("[Чистовик] Failed to normalize input non-breaking spaces", error);
    throw error;
  }
}

function cleanupSpaces(input: string, ruleAnalyticsCollector: TypographyRuleAnalyticsCollector | null = null): string {
  try {
    let text = applyTypographyRule(ruleAnalyticsCollector, "space_trim_lines", input, (value) =>
      value
        .split("\n")
        .map((line) => line.replace(/^[ \t\u00A0]+|[ \t\u00A0]+$/g, ""))
        .join("\n")
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "space_collapse", text, (value) => value.replace(/[ \t\u00A0]{2,}/g, " "));
    text = applyTypographyRule(ruleAnalyticsCollector, "space_before_punctuation", text, (value) => value.replace(/[ \t\u00A0]+([.…:;,?!»)\]])/g, "$1"));
    text = applyTypographyRule(ruleAnalyticsCollector, "space_after_opening_punctuation", text, (value) => value.replace(/([«(\[])[ \t\u00A0]+/g, "$1"));
    text = applyTypographyRule(ruleAnalyticsCollector, "space_percent", text, (value) => value.replace(/(\d)[ \t\u00A0]+%/g, "$1%"));
    return applyTypographyRule(ruleAnalyticsCollector, "space_tilde", text, (value) => value.replace(/~[ \t\u00A0]+(?=[A-Za-zА-Яа-яЁё\d])/g, "~"));
  } catch (error) {
    console.error("[Чистовик] Failed to clean spaces", error);
    throw error;
  }
}

function cleanupQuotesAndPunctuation(input: string, ruleAnalyticsCollector: TypographyRuleAnalyticsCollector | null = null): string {
  try {
    let text = applyTypographyRule(ruleAnalyticsCollector, "punctuation_ellipsis", input, (value) =>
      value.replace(/(^|[^.])\.{3}(?!\.)/g, "$1…")
    );

    if (/(?:…["'»“”]|["'»“”]…)/.test(text)) {
      recordTypographyRuleObservation(ruleAnalyticsCollector, "quote_ellipsis_position");
    }

    text = applyTypographyRule(ruleAnalyticsCollector, "punctuation_repeated_marks", text, (value) =>
      value.replace(/!{2,}/g, "!").replace(/\?{2,}/g, "?")
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "punctuation_question_exclamation_order", text, (value) =>
      value.replace(/(^|[^!?])!\?(?![!?])/g, "$1?!")
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "quote_context_script", text, (value) => formatQuotes(value, ruleAnalyticsCollector));
    text = applyTypographyRule(ruleAnalyticsCollector, "quote_question_exclamation", text, (value) =>
      value
        .replace(/([»“"'])([?!])/g, "$2$1")
        .replace(/([?!](?:[»“"']+))\./g, "$1")
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "punctuation_repeated_marks", text, (value) =>
      value.replace(/!{2,}/g, "!").replace(/\?{2,}/g, "?")
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "punctuation_question_exclamation_order", text, (value) =>
      value.replace(/(^|[^!?])!\?(?![!?])/g, "$1?!")
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "quote_punctuation_outside", text, (value) => value.replace(/([.,;:])([»“"'])/g, "$2$1"));
    return applyTypographyRule(ruleAnalyticsCollector, "space_before_punctuation", text, (value) => value.replace(/[ \t\u00A0]+([.,;:?!…])/g, "$1"));
  } catch (error) {
    console.error("[Чистовик] Failed to clean quotes and punctuation", error);
    throw error;
  }
}

function formatQuotes(input: string, ruleAnalyticsCollector: TypographyRuleAnalyticsCollector | null = null): string {
  try {
    const stack: QuoteState[] = [];
    const lineScripts = input.split("\n").map(detectTopLevelQuoteScriptForLine);
    let lineIndex = 0;
    let result = "";

    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];

      if (!isQuoteChar(char) || isApostropheInsideWord(input, index)) {
        result += char;

        if (char === "\n") {
          lineIndex += 1;
        }

        continue;
      }

      const opening = getQuoteRole(input, index, stack) === "opening";

      if (opening) {
        const script = stack.length === 0 ? lineScripts[lineIndex] ?? "latin" : stack[stack.length - 1].script;
        const level = stack.length;
        const quote = getOpeningQuote(script, level);
        stack.push({ script, level });
        result += quote;

        if (quote !== char) {
          recordTypographyRuleDerivedChange(ruleAnalyticsCollector, script === "latin" ? "quote_latin_levels" : "quote_ru_levels");
        }
      } else {
        const state = stack.pop() ?? {
          script: lineScripts[lineIndex] ?? "latin",
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
  } catch (error) {
    console.error("[Чистовик] Failed to format quotes", error);
    throw error;
  }
}

function isQuoteChar(char: string): boolean {
  try {
    return char === '"' || char === "'" || char === "«" || char === "»" || char === "„" || char === "“" || char === "”" || char === "‘" || char === "’";
  } catch (error) {
    console.error("[Чистовик] Failed to check quote char", error);
    throw error;
  }
}

function isApostropheInsideWord(input: string, index: number): boolean {
  try {
    const char = input[index];

    if (char !== "'" && char !== "’") {
      return false;
    }

    return isLetter(input[index - 1] ?? "") && isLetter(input[index + 1] ?? "");
  } catch (error) {
    console.error("[Чистовик] Failed to check apostrophe context", error);
    throw error;
  }
}

function getQuoteRole(input: string, index: number, stack: QuoteState[]): "opening" | "closing" {
  try {
    const prev = input[index - 1] ?? "";
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
  } catch (error) {
    console.error("[Чистовик] Failed to detect quote role", error);
    throw error;
  }
}

function isQuoteOpeningContext(previous: string): boolean {
  try {
    return previous === "" || /[ \t\u00A0\n\r*([{<«„“‘"'—–-]/.test(previous);
  } catch (error) {
    console.error("[Чистовик] Failed to check quote opening context", error);
    throw error;
  }
}

function isQuoteClosingContext(input: string, index: number): boolean {
  try {
    const previous = previousVisibleChar(input, index);
    const next = input[index + 1] ?? "";

    if (previous === null) {
      return false;
    }

    return next === "" || /[ \t\u00A0\n\r*.,;:?!…)\]}»“"']/.test(next);
  } catch (error) {
    console.error("[Чистовик] Failed to check quote closing context", error);
    throw error;
  }
}

function detectTopLevelQuoteScriptForLine(line: string): QuoteScript {
  try {
    const textOutsideQuotes = getTextOutsideQuotesForScriptDetection(line);
    const outsideScript = detectDominantQuoteScript(textOutsideQuotes);

    if (outsideScript !== null) {
      return outsideScript;
    }

    return detectDominantQuoteScript(line) ?? "latin";
  } catch (error) {
    console.error("[Чистовик] Failed to detect top-level quote script", error);
    throw error;
  }
}

function detectDominantQuoteScript(input: string): QuoteScript | null {
  try {
    const latinCount = countMatches(input, /[A-Za-z]/g);
    const cyrillicCount = countMatches(input, /[А-Яа-яЁё]/g);

    if (latinCount === 0 && cyrillicCount === 0) {
      return null;
    }

    return latinCount > cyrillicCount ? "latin" : "cyrillic";
  } catch (error) {
    console.error("[Чистовик] Failed to detect dominant quote script", error);
    throw error;
  }
}

function getTextOutsideQuotesForScriptDetection(input: string): string {
  try {
    const stack: QuoteState[] = [];
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
      } else {
        stack.pop();
      }
    }

    return result;
  } catch (error) {
    console.error("[Чистовик] Failed to get text outside quotes for script detection", error);
    throw error;
  }
}

function getTextOutsideQuotes(input: string): string {
  try {
    const stack: QuoteState[] = [];
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
      } else {
        stack.pop();
      }
    }

    return result;
  } catch (error) {
    console.error("[Чистовик] Failed to get text outside quotes", error);
    throw error;
  }
}

function getOpeningQuote(script: QuoteScript, level: number): string {
  try {
    if (script === "latin") {
      return level % 2 === 0 ? '"' : "'";
    }

    return level % 2 === 0 ? "«" : "„";
  } catch (error) {
    console.error("[Чистовик] Failed to get opening quote", error);
    throw error;
  }
}

function getClosingQuote(script: QuoteScript, level: number): string {
  try {
    if (script === "latin") {
      return level % 2 === 0 ? '"' : "'";
    }

    return level % 2 === 0 ? "»" : "“";
  } catch (error) {
    console.error("[Чистовик] Failed to get closing quote", error);
    throw error;
  }
}

function cleanupDashesAndHyphens(input: string, ruleAnalyticsCollector: TypographyRuleAnalyticsCollector | null = null): string {
  try {
    let text = applyTypographyRule(ruleAnalyticsCollector, "hyphen_nonbreaking_words", input, restoreSpacedHyphenatedWords);
    text = normalizeEditorialRanges(text, ruleAnalyticsCollector);
    text = applyTypographyRule(ruleAnalyticsCollector, "dash_line_start", text, (value) =>
      value.replace(/^([ \t\u00A0]*)([-–])(?=[ \t\u00A0])/gm, `$1${EM_DASH}`)
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "dash_between_words", text, (value) =>
      value
        .replace(/([^ \t\u00A0\n\r\d])[ \t\u00A0]+[-–][ \t\u00A0]+([A-Za-zА-Яа-яЁё])/g, `$1 ${EM_DASH} $2`)
        .replace(/([A-Za-zА-Яа-яЁё])[ \t\u00A0]+[-–][ \t\u00A0]+([A-Za-zА-Яа-яЁё])/g, `$1 ${EM_DASH} $2`)
    );
    return applyTypographyRule(ruleAnalyticsCollector, "hyphen_nonbreaking_words", text, (value) =>
      value.replace(/([A-Za-zА-Яа-яЁё])-([A-Za-zА-Яа-яЁё])/g, `$1${NB_HYPHEN}$2`)
    );
  } catch (error) {
    console.error("[Чистовик] Failed to clean dashes and hyphens", error);
    throw error;
  }
}

function restoreSpacedHyphenatedWords(input: string): string {
  try {
    const patterns: Array<[RegExp, string]> = [
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
  } catch (error) {
    console.error("[Чистовик] Failed to restore spaced hyphenated words", error);
    throw error;
  }
}

function normalizeEditorialRanges(input: string, ruleAnalyticsCollector: TypographyRuleAnalyticsCollector | null = null): string {
  try {
    let text = input;
    const month = "января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря";
    const year = `[12][ \\t\\u00A0]?\\d{3}`;
    const wordDate = `\\d{1,2}[ \\t\\u00A0]+(?:${month})(?:[ \\t\\u00A0]+${year}(?:[ \\t\\u00A0]+(?:г\\.?|года|году))?)?`;
    const quarterDate = `[IVXLCDM]+[ \\t\\u00A0]+квартал[ \\t\\u00A0]+${year}`;

    const compoundRangeInput = text;
    text = applyTypographyRule(ruleAnalyticsCollector, "range_compound_grouped_number", text, (value) =>
      value.replace(/(^|[^\d])(\d{1,3}(?:[ \t\u00A0]\d{3})+)[ \t\u00A0]*[-–—−][ \t\u00A0]*(\d{1,3}(?:[ \t\u00A0]\d{3})+)(?=$|[^\d])/g, "$1$2 — $3")
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "range_compound_full_date", text, (value) =>
      value.replace(/(^|[^\d.])(\d{1,2}\.\d{1,2}\.\d{2,4})[ \t\u00A0]*[-–—−][ \t\u00A0]*(\d{1,2}\.\d{1,2}\.\d{2,4})(?=$|[^\d])/g, "$1$2 — $3")
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "range_compound_word_date", text, (value) =>
      value.replace(new RegExp(`(^|[^${LETTERS}\\d])(${wordDate})[ \\t\\u00A0]*[-–—−][ \\t\\u00A0]*(${wordDate})(?=$|[^${LETTERS}\\d])`, "gi"), (_match: string, prefix: string, start: string, end: string) => `${prefix}${normalizeSpacedYearInRangeBoundary(start)} ${EM_DASH} ${normalizeSpacedYearInRangeBoundary(end)}`)
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "range_compound_quarter", text, (value) =>
      value.replace(new RegExp(`(^|[^${LETTERS}\\d])(${quarterDate})[ \\t\\u00A0]*[-–—−][ \\t\\u00A0]*(${quarterDate})(?=$|[^${LETTERS}\\d])`, "gi"), (_match: string, prefix: string, start: string, end: string) => `${prefix}${normalizeSpacedYearInRangeBoundary(start)} ${EM_DASH} ${normalizeSpacedYearInRangeBoundary(end)}`)
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "range_compound_open_year", text, (value) =>
      value.replace(/(^|[^\d])(\d{4})[ \t\u00A0]*[-–—−][ \t\u00A0]*(н\.[ \t\u00A0]*в\.|наст\.[ \t\u00A0]*вр\.)(?=$|[^A-Za-zА-Яа-яЁё\d])/gi, (_match: string, prefix: string, start: string, end: string) => `${prefix}${start} ${EM_DASH} ${end.replace(/[ \t\u00A0]+/g, " ")}`)
    );

    if (text !== compoundRangeInput) {
      recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "range_compound");
    }

    text = applyTypographyRule(ruleAnalyticsCollector, "temperature_range", text, (value) =>
      value.replace(/(^|[^\d,+−-])([+−-]\d+(?:[.,]\d+)?)[ \t\u00A0]*(?:\.{3}|…|[-–—−])[ \t\u00A0]*([+−-]\d+(?:[.,]\d+)?)[ \t\u00A0]*°?[ \t\u00A0]*([CFС])(?=$|[^A-Za-zА-Яа-яЁё])/g, (_match: string, prefix: string, start: string, end: string, unit: string) => `${prefix}${normalizeTemperatureSign(start)}…${normalizeTemperatureSign(end)}${NBSP}°${unit === "F" ? "F" : "C"}`)
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "percent_range", text, (value) =>
      value.replace(/(^|[^\d,])(\d+(?:,\d+)?)%[-–—−](\d+(?:,\d+)?)%(?=$|[^\d,])/g, "$1$2—$3%")
    );
    const simpleRangeInput = text;
    text = applyTypographyRule(ruleAnalyticsCollector, "range_simple_time", text, (value) =>
      value.replace(/(^|[^\d:])(\d{1,2}:\d{2})[ \t\u00A0]*[-–—−][ \t\u00A0]*(\d{1,2}:\d{2})(?=$|[^\d:])/g, "$1$2—$3")
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "range_simple_short_date", text, (value) =>
      value.replace(/(^|[^\d.])(\d{1,2}\.\d{1,2})(?!\.\d)[ \t\u00A0]*[-–—−][ \t\u00A0]*(\d{1,2}\.\d{1,2})(?!\.\d)(?=$|[^\d])/g, "$1$2—$3")
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "range_simple_roman", text, (value) =>
      value.replace(/(^|[^A-Za-zА-Яа-яЁё])([IVXLCDM]+)[ \t\u00A0]*[-–—−][ \t\u00A0]*([IVXLCDM]+)(?=$|[^A-Za-zА-Яа-яЁё\d])/g, (match: string, prefix: string, startRoman: string, endRoman: string, offset: number, fullText: string) => {
        try {
          const rangeStart = offset + prefix.length;
          const rangeEnd = rangeStart + match.length - prefix.length;

          if (isProtectedRomanRange(fullText, rangeStart, rangeEnd) || !hasRomanRangeContext(fullText, rangeStart, rangeEnd)) {
            return match;
          }

          return `${prefix}${startRoman}${EM_DASH}${endRoman}`;
        } catch (error) {
          console.error("[Чистовик] Failed to normalize editorial roman range", error);
          return match;
        }
      })
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "range_simple_number", text, (value) =>
      value.replace(/(^|[^\d.,:])(\d+(?:[.,]\d+)?)[ \t\u00A0]*[-–—−][ \t\u00A0]*(\d+(?:[.,]\d+)?)(?=$|[^\d.,:])/g, (match: string, prefix: string, startNumber: string, endNumber: string, offset: number, fullText: string) => {
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
        } catch (error) {
          console.error("[Чистовик] Failed to normalize editorial numeric range", error);
          return match;
        }
      })
    );

    if (text !== simpleRangeInput) {
      recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "range_simple");
    }

    return text;
  } catch (error) {
    console.error("[Чистовик] Failed to normalize editorial ranges", error);
    throw error;
  }
}

function isGroupedNumberFragment(fullText: string, start: number, end: number): boolean {
  try {
    const previous = fullText[start - 1] ?? "";
    const previousPrevious = fullText[start - 2] ?? "";
    const next = fullText[end] ?? "";
    const nextNext = fullText[end + 1] ?? "";

    return ((previous === " " || previous === NBSP) && /\d/.test(previousPrevious)) || ((next === " " || next === NBSP) && /\d/.test(nextNext));
  } catch (error) {
    console.error("[Чистовик] Failed to check grouped number fragment", error);
    throw error;
  }
}

function normalizeSpacedYearInRangeBoundary(input: string): string {
  try {
    return input.replace(/\b([12])[ \t\u00A0](\d{3})\b/g, "$1$2");
  } catch (error) {
    console.error("[Чистовик] Failed to normalize spaced year in range boundary", error);
    throw error;
  }
}

function normalizeTemperatureSign(input: string): string {
  try {
    return input.replace(/^-/, MINUS);
  } catch (error) {
    console.error("[Чистовик] Failed to normalize temperature sign", error);
    throw error;
  }
}

function isProtectedNumericRange(fullText: string, start: number, end: number): boolean {
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

    return isCodeTokenNeighbor(fullText[start - 1] ?? "") || isCodeTokenNeighbor(fullText[end] ?? "");
  } catch (error) {
    console.error("[Чистовик] Failed to check protected numeric range", error);
    throw error;
  }
}

function isWordDateRangeNumericFragment(fullText: string, start: number, end: number): boolean {
  try {
    const month = "января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря";
    const before = fullText.slice(Math.max(0, start - 24), start);
    const after = fullText.slice(end, Math.min(fullText.length, end + 24));
    const monthBefore = new RegExp(`(?:${month})[ \\t\\u00A0]+$`, "i");
    const monthAfter = new RegExp(`^[ \\t\\u00A0]+(?:${month})(?=$|[^${LETTERS}])`, "i");

    return monthBefore.test(before) && monthAfter.test(after);
  } catch (error) {
    console.error("[Чистовик] Failed to check word date range numeric fragment", error);
    throw error;
  }
}

function isProtectedRomanRange(fullText: string, start: number, end: number): boolean {
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
  } catch (error) {
    console.error("[Чистовик] Failed to check protected roman range", error);
    throw error;
  }
}

function hasRomanRangeContext(fullText: string, start: number, end: number): boolean {
  try {
    return hasRomanRangeContextBefore(fullText, start) || hasRomanRangeContextAfter(fullText, end);
  } catch (error) {
    console.error("[Чистовик] Failed to check roman range context", error);
    throw error;
  }
}

function hasRomanRangeContextBefore(fullText: string, start: number): boolean {
  try {
    const before = fullText.slice(0, start).toLowerCase();
    const match = /(^|[^А-Яа-яЁё])(век|века|веках|веков|глава|главы|глав|часть|части|частей|раздел|разделы|разделов|пункт|пункты|пунктов|квартал|кварталы|кварталов|кв\.|том|тома|томов|параграф|параграфы|параграфов)[ \t\u00A0]*$/.exec(before);

    return match !== null;
  } catch (error) {
    console.error("[Чистовик] Failed to check roman range context before", error);
    throw error;
  }
}

function hasRomanRangeContextAfter(fullText: string, end: number): boolean {
  try {
    const after = fullText.slice(end).toLowerCase();
    const match = /^[ \t\u00A0]*(век|века|веках|веков|глава|главы|глав|часть|части|частей|раздел|разделы|разделов|пункт|пункты|пунктов|квартал|кварталы|кварталов|кв\.|том|тома|томов|параграф|параграфы|параграфов)(?=$|[^А-Яа-яЁё])/.exec(after);

    return match !== null;
  } catch (error) {
    console.error("[Чистовик] Failed to check roman range context after", error);
    throw error;
  }
}

function hasProtectedRomanRangeTokenLetters(token: string): boolean {
  try {
    for (const char of token) {
      if (isLetter(char) && !/[IVXLCDM]/.test(char)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("[Чистовик] Failed to check protected roman range token letters", error);
    throw error;
  }
}

function formatPhoneNumbers(input: string, ruleAnalyticsCollector: TypographyRuleAnalyticsCollector | null = null, numberLayerContext: NumberLayerContext | null = null): string {
  try {
    let text = applyTypographyRule(ruleAnalyticsCollector, "phone_ru_format", input, (value) =>
      value.replace(/^([ \t\u00A0]*)(9\d{2})[ \t\u00A0.\-–—‑]*(\d{3})[ \t\u00A0.\-–—‑]*(\d{2})[ \t\u00A0.\-–—‑]*(\d{2})([ \t\u00A0]*)$/, (match: string, prefix: string, operator: string, first: string, second: string, third: string, suffix: string) => {
        const replacement = `${prefix}${operator}${NBSP}${first}${NB_HYPHEN}${second}${NB_HYPHEN}${third}${suffix}`;

        if (replacement !== match) {
          recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "phone_ru_separators");
        }

        return replacement;
      })
    );
    const phoneCandidate = /(^|[^\d])((?:\+[ \t\u00A0]*)?[78](?:[ \t\u00A0().\-–—‑]*\d){10})(?![ \t\u00A0().\-–—‑]*\d)/g;

    text = applyTypographyRule(ruleAnalyticsCollector, "phone_ru_format", text, (value) =>
      value.replace(phoneCandidate, (match, prefix: string, candidate: string, offset: number, fullText: string) => {
        try {
          const candidateStart = offset + prefix.length;
          const candidateEnd = candidateStart + candidate.length;
          const currencyBefore = (getQuantityEvidenceBefore(fullText, candidateStart) ?? numberLayerContext?.evidenceBefore)?.kind === "currency";
          const explicitlyFormattedPhone = /[()\-–—‑]/.test(candidate) || /^\+?[78][ \t\u00A0]+\d{3}[ \t\u00A0]+\d{3}[ \t\u00A0]+\d{2}[ \t\u00A0]+\d{2}$/.test(candidate.trim());
          const explicitPhoneMeaning = explicitlyFormattedPhone || hasTelephoneQuantityLabel(fullText, candidateStart) || numberLayerContext?.protectedAsPhoneByNeighbor === true;

          if (previousNonSpaceSkippingDevelopmentMarker(fullText, candidateStart) === "№" || isInsideProtectedNumericIdentifier(fullText, candidateStart, candidateStart + candidate.length) || (currencyBefore && !explicitPhoneMeaning)) {
            recordTypographyRuleObservation(ruleAnalyticsCollector, "phone_protected_contexts");
            return match;
          }

          const currencyAfter = (getQuantityEvidenceAfter(fullText, candidateEnd) ?? numberLayerContext?.evidenceAfter)?.kind === "currency";

          if (currencyAfter && !explicitPhoneMeaning) {
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
        } catch (error) {
          console.error("[Чистовик] Failed to format phone candidate", error);
          return match;
        }
      })
    );

    return text;
  } catch (error) {
    console.error("[Чистовик] Failed to format phone numbers", error);
    throw error;
  }
}

function moveLeadingCurrencySymbolsAfterQuantity(input: string): string {
  try {
    return input.replace(LEADING_CURRENCY_VALUE_PATTERN, (_match: string, prefix: string, currency: string, value: string, scale: string | undefined) =>
      `${prefix}${value}${scale ?? ""}${NBSP}${currency}`
    );
  } catch (error) {
    console.error("[Чистовик] Failed to move leading currency symbol", error);
    throw error;
  }
}

type QuantityEvidenceKind = "currency" | "quantity";

interface QuantityEvidence {
  kind: QuantityEvidenceKind;
  marker: string;
}

interface NumberLayerContext {
  diagnosticNeighbors: NumberDiagnosticNeighbor[];
  evidenceAfter: QuantityEvidence | null;
  evidenceBefore: QuantityEvidence | null;
  protectedAsPhoneByNeighbor: boolean;
  protectedByNeighbor: boolean;
  standalonePhonePrefix: boolean;
  snapshotKey: string;
}

interface NumberDiagnosticToken {
  end: number;
  start: number;
  text: string;
}

function collectNumberDiagnosticTokens(input: string): NumberDiagnosticToken[] {
  try {
    const tokens: NumberDiagnosticToken[] = [];
    const pattern = /[+−-]?\d(?:[\d \t\u00A0\u2009\u202F.,:'’ʼ/()—–‑-]*\d)?/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(input)) !== null) {
      let start = match.index;
      let text = match[0];

      if (
        /^[+−-]/.test(text) &&
        start > 0 &&
        new RegExp(`[${LETTERS}\\d]`).test(input[start - 1])
      ) {
        start += 1;
        text = text.slice(1);
      }

      if (/\d/.test(text)) {
        tokens.push({
          end: start + text.length,
          start,
          text,
        });
      }

      if (match[0].length === 0) {
        pattern.lastIndex += 1;
      }
    }

    return tokens;
  } catch (error) {
    console.error("[Чистовик] Failed to collect number diagnostic tokens", error);
    return [];
  }
}

function getNumberDiagnosticDigits(token: NumberDiagnosticToken): string {
  return token.text.replace(/\D/g, "");
}

function normalizeDevelopmentMarkersForNumberDiagnostics(
  input: string,
  developmentMarkerIndexes: number[]
): string {
  try {
    if (developmentMarkerIndexes.length === 0 || !input.includes(DEVELOPMENT_NBSP_MARKER)) {
      return input;
    }

    const characters = input.split("");

    for (const index of developmentMarkerIndexes) {
      if (Number.isInteger(index) && index >= 0 && index < characters.length && characters[index] === DEVELOPMENT_NBSP_MARKER) {
        characters[index] = NBSP;
      }
    }

    return characters.join("");
  } catch (error) {
    console.error("[Чистовик] Failed to normalize development markers for number diagnostics", error);
    return input;
  }
}

function pairNumberDiagnosticTokens(
  beforeTokens: NumberDiagnosticToken[],
  afterTokens: NumberDiagnosticToken[]
): Array<{ after: NumberDiagnosticToken | null; before: NumberDiagnosticToken | null }> {
  try {
    const pairs: Array<{ after: NumberDiagnosticToken | null; before: NumberDiagnosticToken | null }> = [];
    const usedAfterIndexes = new Set<number>();

    for (let beforeIndex = 0; beforeIndex < beforeTokens.length; beforeIndex += 1) {
      const before = beforeTokens[beforeIndex];
      const digits = getNumberDiagnosticDigits(before);
      let afterIndex = afterTokens.findIndex(
        (candidate, candidateIndex) => !usedAfterIndexes.has(candidateIndex) && getNumberDiagnosticDigits(candidate) === digits
      );

      if (afterIndex === -1 && beforeIndex < afterTokens.length && !usedAfterIndexes.has(beforeIndex)) {
        afterIndex = beforeIndex;
      }

      if (afterIndex === -1) {
        pairs.push({ after: null, before });
      } else {
        usedAfterIndexes.add(afterIndex);
        pairs.push({ after: afterTokens[afterIndex], before });
      }
    }

    for (let afterIndex = 0; afterIndex < afterTokens.length; afterIndex += 1) {
      if (!usedAfterIndexes.has(afterIndex)) {
        pairs.push({ after: afterTokens[afterIndex], before: null });
      }
    }

    return pairs;
  } catch (error) {
    console.error("[Чистовик] Failed to pair number diagnostic tokens", error);
    return [];
  }
}

function getNumberDiagnosticContext(input: string, token: NumberDiagnosticToken | null): string {
  try {
    if (token === null) {
      return "";
    }

    const wordPattern = new RegExp(`[${LETTERS}]{4,}`, "g");
    const words: Array<{ end: number; start: number }> = [];
    let match: RegExpExecArray | null;

    while ((match = wordPattern.exec(input)) !== null) {
      words.push({ start: match.index, end: match.index + match[0].length });
    }

    const previousWord = words.filter((word) => word.end <= token.start).pop() ?? null;
    const nextWord = words.find((word) => word.start >= token.end) ?? null;
    const start = previousWord?.start ?? 0;
    const end = nextWord?.end ?? input.length;
    return input.slice(start, end);
  } catch (error) {
    console.error("[Чистовик] Failed to build number diagnostic context", error);
    return token?.text ?? "";
  }
}

function getNumberDiagnosticEvidence(
  input: string,
  token: NumberDiagnosticToken,
  numberLayerContext: NumberLayerContext | null
): { after: QuantityEvidence | null; before: QuantityEvidence | null } {
  try {
    return {
      after: getQuantityEvidenceAfter(input, token.end) ?? numberLayerContext?.evidenceAfter ?? null,
      before: getQuantityEvidenceBefore(input, token.start) ?? numberLayerContext?.evidenceBefore ?? null,
    };
  } catch (error) {
    console.error("[Чистовик] Failed to read number diagnostic evidence", error);
    return {
      after: numberLayerContext?.evidenceAfter ?? null,
      before: numberLayerContext?.evidenceBefore ?? null,
    };
  }
}

function findDiagnosticMarkerBefore(input: string, start: number, marker: string): number | null {
  try {
    const left = input.slice(Math.max(0, start - marker.length - 16), start);
    const normalizedMarker = marker.toLowerCase();
    const index = left.toLowerCase().lastIndexOf(normalizedMarker);
    return index === -1 ? null : Math.max(0, start - marker.length - 16) + index;
  } catch {
    return null;
  }
}

function findDiagnosticMarkerAfter(input: string, end: number, marker: string): number | null {
  try {
    const right = input.slice(end, Math.min(input.length, end + marker.length + 16));
    const index = right.toLowerCase().indexOf(marker.toLowerCase());
    return index === -1 ? null : end + index;
  } catch {
    return null;
  }
}

function getNumberDiagnosticRepresentation(
  input: string,
  token: NumberDiagnosticToken | null,
  numberLayerContext: NumberLayerContext | null
): string {
  try {
    if (token === null) {
      return "";
    }

    const evidence = getNumberDiagnosticEvidence(input, token, numberLayerContext);
    let start = token.start;
    let end = token.end;

    if (evidence.before !== null && numberLayerContext?.evidenceBefore == null) {
      const markerStart = findDiagnosticMarkerBefore(input, token.start, evidence.before.marker);

      if (markerStart !== null) {
        start = markerStart;
      }
    }

    if (evidence.after !== null && numberLayerContext?.evidenceAfter == null) {
      const markerStart = findDiagnosticMarkerAfter(input, token.end, evidence.after.marker);

      if (markerStart !== null) {
        end = markerStart + evidence.after.marker.length;
      }
    }

    return input.slice(start, end);
  } catch (error) {
    console.error("[Чистовик] Failed to build number diagnostic representation", error);
    return token?.text ?? "";
  }
}

function isStandaloneNumberDiagnosticLayer(input: string): boolean {
  try {
    const trimmed = input.trim();
    return /\d/.test(trimmed) && !new RegExp(`[${LETTERS}]{4,}`).test(trimmed);
  } catch {
    return false;
  }
}

function getNumberDiagnosticLocalWindow(input: string, token: NumberDiagnosticToken | null): string {
  if (token === null) {
    return "";
  }

  return input.slice(Math.max(0, token.start - 4), Math.min(input.length, token.end + 4));
}

function isProtectedNumberDiagnostic(
  input: string,
  token: NumberDiagnosticToken,
  numberLayerContext: NumberLayerContext | null
): boolean {
  try {
    return (
      numberLayerContext?.protectedByNeighbor === true ||
      isInsideProtectedNumericIdentifier(input, token.start, token.end) ||
      isNumberInsideDateLikeToken(input, token.start, token.end) ||
      isDottedNumbering(input, token.start, token.end) ||
      isNumberPartOfDate(input, token.start, token.end) ||
      isNumberPartOfCodeToken(input, token.start, token.end) ||
      isInsidePhoneNumberCandidate(input, token.start, token.end) ||
      isVisiblyStructuredNumericIdentifier(input, token.start, token.end)
    );
  } catch (error) {
    console.error("[Чистовик] Failed to classify protected diagnostic number", error);
    return false;
  }
}

function getNumberDiagnosticKind(
  input: string,
  token: NumberDiagnosticToken,
  evidence: { after: QuantityEvidence | null; before: QuantityEvidence | null },
  numberLayerContext: NumberLayerContext | null
): string {
  try {
    const value = token.text.trim();
    const compact = value.replace(/[ \t\u00A0\u2009\u202F]/g, "");

    if (isInsidePhoneNumberCandidate(input, token.start, token.end) || isRussianFullPhoneToken(value)) {
      return "Номер телефона";
    }

    if (numberLayerContext?.protectedByNeighbor === true || isInsideProtectedNumericIdentifier(input, token.start, token.end)) {
      return "Идентификатор";
    }

    if (isNumberInsideDateLikeToken(input, token.start, token.end) || isNumberPartOfDate(input, token.start, token.end)) {
      return "Дата";
    }

    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(compact)) {
      return "IP-адрес";
    }

    if (/^v?\d+(?:\.\d+){1,}$/i.test(compact)) {
      return "Версия или нумерация";
    }

    if (isNumberPartOfCodeToken(input, token.start, token.end)) {
      return "Число внутри кода";
    }

    const quantityEvidence = evidence.after ?? evidence.before;

    if (quantityEvidence?.kind === "currency") {
      return numberLayerContext !== null && (numberLayerContext.evidenceAfter !== null || numberLayerContext.evidenceBefore !== null)
        ? "Сумма с валютой в соседнем слое"
        : "Сумма с валютой";
    }

    if (quantityEvidence?.kind === "quantity") {
      return numberLayerContext !== null && (numberLayerContext.evidenceAfter !== null || numberLayerContext.evidenceBefore !== null)
        ? "Количество с обозначением в соседнем слое"
        : "Количество с обозначением";
    }

    if (/[—–-]/.test(value.slice(1))) {
      return "Диапазон чисел";
    }

    return "Число без количественного признака";
  } catch (error) {
    console.error("[Чистовик] Failed to name number diagnostic kind", error);
    return "Числовая конструкция";
  }
}

function getProtectiveLabelBeforeNumber(input: string, start: number): string | null {
  try {
    const before = input.slice(Math.max(0, start - 96), start).replace(/[ \t\u00A0\u2009\u202F:]+$/, "");
    const normalizedBefore = before.toLowerCase();

    for (const label of QUANTITY_PROTECTIVE_LABELS) {
      const normalizedLabel = label.toLowerCase();

      if (!normalizedBefore.endsWith(normalizedLabel)) {
        continue;
      }

      const boundary = normalizedBefore.length - normalizedLabel.length - 1;

      if (boundary < 0 || !/[A-Za-zА-Яа-яЁё\d]/.test(normalizedBefore[boundary])) {
        return label;
      }
    }

    return null;
  } catch (error) {
    console.error("[Чистовик] Failed to read protective label for diagnostics", error);
    return null;
  }
}

function getNumberDiagnosticProtectionBasis(
  input: string,
  token: NumberDiagnosticToken,
  numberLayerContext: NumberLayerContext | null
): string | null {
  try {
    const protectiveNeighbor = numberLayerContext?.diagnosticNeighbors.find(
      (neighbor) => neighbor.usedAsEvidence && neighbor.role === "protection"
    );

    if (protectiveNeighbor !== undefined) {
      return `Защита: ${protectiveNeighbor.text.trim().replace(/:$/, "")} в соседнем слое`;
    }

    const protectiveLabel = getProtectiveLabelBeforeNumber(input, token.start);

    if (protectiveLabel !== null) {
      return `Защита: ${protectiveLabel}`;
    }

    const bounds = getNumericIdentifierTokenBounds(input, token.start, token.end);
    const identifierToken = normalizeHorizontalSpaces(input.slice(bounds.start, bounds.end)).trim();

    if (isCardMaskToken(identifierToken) || isNumberPartOfMaskedSecret(input, token.start, token.text.replace(/\D/g, ""))) {
      return "Защита: маска карты";
    }

    if (isPaymentAccountNumberToken(identifierToken)) {
      return "Защита: номер счёта";
    }

    if (isPaymentCardNumberToken(identifierToken)) {
      return "Защита: номер карты";
    }

    if (isInsidePhoneNumberCandidate(input, token.start, token.end) || isRussianFullPhoneToken(token.text.trim())) {
      return "Защита: номер телефона";
    }

    if (isNumberInsideDateLikeToken(input, token.start, token.end) || isNumberPartOfDate(input, token.start, token.end)) {
      return "Защита: дата";
    }

    if (isDottedNumbering(input, token.start, token.end)) {
      return "Защита: версия или нумерация";
    }

    if (isNumberPartOfCodeToken(input, token.start, token.end)) {
      return "Защита: буквенно-числовой код";
    }

    if (isVisiblyStructuredNumericIdentifier(input, token.start, token.end)) {
      return "Защита: структурированный идентификатор";
    }

    return null;
  } catch (error) {
    console.error("[Чистовик] Failed to explain number protection", error);
    return null;
  }
}

function getNumberDiagnosticDecisionBasis(
  input: string,
  token: NumberDiagnosticToken,
  numberLayerContext: NumberLayerContext | null,
  representationChanged: boolean,
  protectedNumber: boolean
): string {
  try {
    if (protectedNumber && !representationChanged) {
      const protection = getNumberDiagnosticProtectionBasis(input, token, numberLayerContext);

      if (protection !== null) {
        return protection;
      }
    }

    const evidenceNeighbor = numberLayerContext?.diagnosticNeighbors.find(
      (neighbor) => neighbor.usedAsEvidence && neighbor.role === "evidence"
    );

    if (evidenceNeighbor !== undefined) {
      const marker = numberLayerContext?.evidenceAfter?.marker ?? numberLayerContext?.evidenceBefore?.marker ?? evidenceNeighbor.text.trim();
      return `${marker} в соседнем слое`;
    }

    const evidenceAfter = getQuantityEvidenceAfter(input, token.end);

    if (evidenceAfter !== null) {
      return `${evidenceAfter.marker} после числа`;
    }

    const evidenceBefore = getQuantityEvidenceBefore(input, token.start);

    if (evidenceBefore !== null) {
      return `${evidenceBefore.marker} перед числом`;
    }

    const monthAfter = /^[ \t\u00A0\u2009\u202F]*(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?=$|[^A-Za-zА-Яа-яЁё])/i.exec(
      input.slice(token.end)
    );

    if (monthAfter !== null) {
      return `${monthAfter[1]} после числа`;
    }

    const protection = getNumberDiagnosticProtectionBasis(input, token, numberLayerContext);
    return protection ?? "Признак количества не найден";
  } catch (error) {
    console.error("[Чистовик] Failed to explain number decision", error);
    return "Не удалось определить признак решения";
  }
}

function getNumberDiagnosticRuleCodes(before: string, after: string, numberKind: string): string[] {
  try {
    if (before === after) {
      return [];
    }

    const codes = new Set<string>();
    const beforeDigits = before.replace(/\D/g, "");
    const afterDigits = after.replace(/\D/g, "");

    if (/\d\.\d/.test(before) && /\d,\d/.test(after)) {
      codes.add("number_decimal_comma");
    }

    if (beforeDigits === afterDigits && /\d[ \u00A0\u2009\u202F]\d{3}/.test(after) && !/\d[ \u00A0\u2009\u202F]\d{3}/.test(before)) {
      codes.add("number_group_digits");
    }

    if (/\d,\d{3}(?:,\d{3})|\d['’ʼ]\d{3}/.test(before) && /\d[ \u00A0\u202F]\d{3}/.test(after)) {
      codes.add("number_western_format");
    }

    if (
      new RegExp(`[${QUANTITY_CURRENCY_SYMBOLS}]`).test(before + after) &&
      before !== after
    ) {
      codes.add("number_unit_currency_nbsp");
    }

    if (/Номер телефона/.test(numberKind)) {
      codes.add("phone_ru_format");
      codes.add("phone_ru_separators");
    }

    if (/\d[ \t\u00A0]+%/.test(before) && /\d%/.test(after)) {
      codes.add("space_percent");
    }

    if (codes.size === 0) {
      codes.add("number_context_change");
    }

    return Array.from(codes);
  } catch (error) {
    console.error("[Чистовик] Failed to derive number diagnostic rules", error);
    return [];
  }
}

function createNumberDiagnosticCases(
  beforeText: string,
  afterText: string,
  numberLayerContext: NumberLayerContext | null,
  beforeDevelopmentMarkerIndexes: number[] = [],
  afterDevelopmentMarkerIndexes: number[] = []
): NumberDiagnosticCase[] {
  try {
    const diagnosticBeforeText = normalizeDevelopmentMarkersForNumberDiagnostics(
      beforeText,
      beforeDevelopmentMarkerIndexes
    );
    const diagnosticAfterText = normalizeDevelopmentMarkersForNumberDiagnostics(
      afterText,
      afterDevelopmentMarkerIndexes
    );
    const beforeTokens = collectNumberDiagnosticTokens(diagnosticBeforeText);
    const afterTokens = collectNumberDiagnosticTokens(diagnosticAfterText);
    const pairs = pairNumberDiagnosticTokens(beforeTokens, afterTokens);
    const includeNeighbors = isStandaloneNumberDiagnosticLayer(diagnosticBeforeText);
    const neighbors = includeNeighbors ? numberLayerContext?.diagnosticNeighbors ?? [] : [];
    const layerMode: NumberDiagnosticLayerMode = neighbors.length > 0 ? "multiple" : "single";

    return pairs.map(({ after, before }) => {
      const sourceToken = before ?? after as NumberDiagnosticToken;
      const sourceText = before === null ? diagnosticAfterText : diagnosticBeforeText;
      const evidence = getNumberDiagnosticEvidence(sourceText, sourceToken, numberLayerContext);
      const numberBefore = getNumberDiagnosticRepresentation(diagnosticBeforeText, before, numberLayerContext);
      const numberAfter = getNumberDiagnosticRepresentation(diagnosticAfterText, after, numberLayerContext);
      const numberKind = getNumberDiagnosticKind(sourceText, sourceToken, evidence, numberLayerContext);
      const representationChanged =
        before !== null &&
        after !== null &&
        (
          numberBefore !== numberAfter ||
          getNumberDiagnosticLocalWindow(diagnosticBeforeText, before) !==
            getNumberDiagnosticLocalWindow(diagnosticAfterText, after)
        );
      const protectedNumber =
        before !== null && isProtectedNumberDiagnostic(diagnosticBeforeText, before, numberLayerContext);
      const hasEvidence = evidence.before !== null || evidence.after !== null;
      const alreadyFormattedPhone = before !== null && isRussianFullPhoneToken(before.text.trim());
      let status: NumberDiagnosticStatus;
      let reason: string;

      if (before === null || after === null) {
        status = "review";
        reason = "Не удалось уверенно сопоставить число до и после обработки";
      } else if (representationChanged) {
        status = "changed";
        reason = getNumberDiagnosticDecisionBasis(sourceText, sourceToken, numberLayerContext, representationChanged, protectedNumber);
      } else if (protectedNumber && !alreadyFormattedPhone) {
        status = "skipped_policy";
        reason = getNumberDiagnosticDecisionBasis(sourceText, sourceToken, numberLayerContext, representationChanged, protectedNumber);
      } else if (hasEvidence || alreadyFormattedPhone) {
        status = "already_correct";
        reason = getNumberDiagnosticDecisionBasis(sourceText, sourceToken, numberLayerContext, representationChanged, protectedNumber);
      } else {
        status = "skipped_policy";
        reason = "Признак количества не найден";
      }

      return {
        afterText: getNumberDiagnosticContext(diagnosticAfterText, after),
        beforeText: getNumberDiagnosticContext(diagnosticBeforeText, before),
        id: createAnalyticsEventId(),
        layerMode,
        neighbors,
        numberAfter,
        numberBefore,
        numberKind,
        numberRulesVersion: NUMBER_RULES_VERSION,
        reason,
        ruleCodes: getNumberDiagnosticRuleCodes(numberBefore, numberAfter, numberKind),
        status,
      };
    });
  } catch (error) {
    console.error("[Чистовик] Failed to create number diagnostic cases", error);
    return [];
  }
}

function normalizeQuantityMarkerForLookup(input: string): string {
  try {
    return input.replace(/[ \t\u00A0\u2009\u202F*]+/g, " ").trim().replace(/ё/g, "е");
  } catch (error) {
    console.error("[Чистовик] Failed to normalize quantity marker", error);
    throw error;
  }
}

function getQuantityMarkerKind(marker: string): QuantityEvidenceKind | null {
  try {
    const normalized = normalizeQuantityMarkerForLookup(marker);

    if (normalized.length === 1 && QUANTITY_CURRENCY_SYMBOLS.includes(normalized)) {
      return "currency";
    }

    if (QUANTITY_CURRENCY_CODES.has(normalized)) {
      return "currency";
    }

    const lower = normalized.toLowerCase();

    if (QUANTITY_CURRENCY_WORDS.has(lower)) {
      return "currency";
    }

    if (QUANTITY_MULTIWORD_FORMS.has(normalized) || QUANTITY_MULTIWORD_FORMS.has(lower) || QUANTITY_MARKER_FORMS.has(normalized) || QUANTITY_MARKER_FORMS.has(lower) || QUANTITY_FULL_WORD_FORMS.has(lower)) {
      return "quantity";
    }

    if (normalized.endsWith(".") && lower !== "г.") {
      return getQuantityMarkerKind(normalized.slice(0, -1));
    }

    return null;
  } catch (error) {
    console.error("[Чистовик] Failed to classify quantity marker", error);
    throw error;
  }
}

function getMarkerPrefixes(input: string): string[] {
  try {
    const trimmed = input.replace(/^[ \t\u00A0\u2009\u202F*]+/, "");

    if (trimmed.length === 0) {
      return [];
    }

    if (QUANTITY_CURRENCY_SYMBOLS.includes(trimmed[0])) {
      return [trimmed[0]];
    }

    const candidate = /^[^,;()\[\]{}\n\r!?]+/.exec(trimmed)?.[0]?.trim() ?? "";

    if (candidate.length === 0) {
      return [];
    }

    const parts = candidate.split(/[ \t\u00A0\u2009\u202F]+/).slice(0, 4);
    const prefixes: string[] = [];

    for (let count = parts.length; count >= 1; count -= 1) {
      prefixes.push(parts.slice(0, count).join(" "));
    }

    return prefixes;
  } catch (error) {
    console.error("[Чистовик] Failed to get quantity marker prefixes", error);
    throw error;
  }
}

function getMarkerSuffixes(input: string): string[] {
  try {
    const trimmed = input.replace(/[ \t\u00A0\u2009\u202F*]+$/, "");

    if (trimmed.length === 0) {
      return [];
    }

    const last = trimmed[trimmed.length - 1];

    if (QUANTITY_CURRENCY_SYMBOLS.includes(last)) {
      return [last];
    }

    const candidate = /[^,;()\[\]{}\n\r!?]+$/.exec(trimmed)?.[0]?.trim() ?? "";

    if (candidate.length === 0) {
      return [];
    }

    const parts = candidate.split(/[ \t\u00A0\u2009\u202F]+/);
    const suffixes: string[] = [];

    for (let count = Math.min(parts.length, 4); count >= 1; count -= 1) {
      suffixes.push(parts.slice(parts.length - count).join(" "));
    }

    return suffixes;
  } catch (error) {
    console.error("[Чистовик] Failed to get quantity marker suffixes", error);
    throw error;
  }
}

function getQuantityEvidenceAfter(fullText: string, end: number): QuantityEvidence | null {
  try {
    const after = fullText.slice(end, Math.min(fullText.length, end + 96));

    for (const marker of getMarkerPrefixes(after)) {
      const kind = getQuantityMarkerKind(marker);

      if (kind === null) {
        continue;
      }

      const normalized = normalizeQuantityMarkerForLookup(marker);
      const remainder = after.replace(/^[ \t\u00A0\u2009\u202F*]+/, "").slice(marker.length);

      if (kind === "currency" && normalized.length > 1 && !/^[ \t\u00A0\u2009\u202F*]/.test(after)) {
        return null;
      }

      if (normalized === "с" && /^[ \t\u00A0\u2009\u202F]+[A-Za-zА-Яа-яЁё]/.test(remainder)) {
        return null;
      }

      if (normalized === "г" && /^\./.test(remainder)) {
        return null;
      }

      return { kind, marker };
    }

    return null;
  } catch (error) {
    console.error("[Чистовик] Failed to find quantity evidence after number", error);
    throw error;
  }
}

function getQuantityEvidenceBefore(fullText: string, start: number): QuantityEvidence | null {
  try {
    const before = fullText.slice(Math.max(0, start - 96), start);

    for (const marker of getMarkerSuffixes(before)) {
      const kind = getQuantityMarkerKind(marker);

      if (kind === "currency" && (marker.length === 1 || /[ \t\u00A0\u2009\u202F*]$/.test(before))) {
        return { kind, marker };
      }
    }

    const signedSymbol = /([₽$€£¥₸₾₴₺֏₪₹₩₫฿₱])[ \t\u00A0\u2009\u202F]*(?:[+−-][ \t\u00A0\u2009\u202F]*)?\(?[ \t\u00A0\u2009\u202F]*$/.exec(before);

    if (signedSymbol !== null) {
      return { kind: "currency", marker: signedSymbol[1] };
    }

    const separated = /(?:^|[ \t\u00A0])([^,;()\[\]{}\n\r!?]{1,80})[ \t\u00A0]+(?:[:—–-])[ \t\u00A0]+$/.exec(before);

    if (separated !== null) {
      for (const marker of getMarkerSuffixes(separated[1])) {
        const kind = getQuantityMarkerKind(marker);

        if (kind !== null && marker.length > 1) {
          return { kind, marker };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("[Чистовик] Failed to find quantity evidence before number", error);
    throw error;
  }
}

function getQuantityEvidence(fullText: string, start: number, end: number, numberLayerContext: NumberLayerContext | null = null): QuantityEvidence | null {
  try {
    return getQuantityEvidenceAfter(fullText, end) ?? getQuantityEvidenceBefore(fullText, start) ?? numberLayerContext?.evidenceAfter ?? numberLayerContext?.evidenceBefore ?? null;
  } catch (error) {
    console.error("[Чистовик] Failed to find quantity evidence", error);
    throw error;
  }
}

function hasProtectiveQuantityLabel(fullText: string, start: number): boolean {
  try {
    const before = fullText.slice(Math.max(0, start - 96), start).replace(/[ \t\u00A0\u2009\u202F:]+$/, "");

    return QUANTITY_PROTECTIVE_LABELS.some((label) => {
      const normalizedLabel = label.toLowerCase();
      const normalizedBefore = before.toLowerCase();

      if (!normalizedBefore.endsWith(normalizedLabel)) {
        return false;
      }

      const boundary = normalizedBefore.length - normalizedLabel.length - 1;
      return boundary < 0 || !/[A-Za-zА-Яа-яЁё\d]/.test(normalizedBefore[boundary]);
    });
  } catch (error) {
    console.error("[Чистовик] Failed to check protective quantity label", error);
    throw error;
  }
}

function hasTelephoneQuantityLabel(fullText: string, start: number): boolean {
  try {
    const before = fullText.slice(Math.max(0, start - 32), start).replace(/[ \t\u00A0\u2009\u202F:]+$/, "").toLowerCase();
    const label = "телефон";

    if (!before.endsWith(label)) {
      return false;
    }

    const boundary = before.length - label.length - 1;
    return boundary < 0 || !/[A-Za-zА-Яа-яЁё\d]/.test(before[boundary]);
  } catch (error) {
    console.error("[Чистовик] Failed to check telephone quantity label", error);
    throw error;
  }
}

function isCompactRussianPhoneDigits(integerPart: string): boolean {
  try {
    return /^9\d{9}$/.test(integerPart) || /^[78]\d{10}$/.test(integerPart);
  } catch (error) {
    console.error("[Чистовик] Failed to check compact Russian phone digits", error);
    throw error;
  }
}

function isVisiblyStructuredNumericIdentifier(fullText: string, start: number, end: number): boolean {
  try {
    const bounds = getNumericIdentifierTokenBounds(fullText, start, end);
    const token = normalizeHorizontalSpaces(fullText.slice(bounds.start, bounds.end)).trim();

    if (isCardMaskToken(token)) {
      return true;
    }

    if (!/[ \u00A0‑–—-]/.test(token)) {
      return false;
    }

    return isPaymentCardNumberToken(token) || isPaymentAccountNumberToken(token);
  } catch (error) {
    console.error("[Чистовик] Failed to check visible numeric identifier structure", error);
    throw error;
  }
}

function shouldProtectEvidenceBasedNumber(fullText: string, start: number, end: number, integerPart: string, numberLayerContext: NumberLayerContext | null = null, ignoreRangeSeparator = false): boolean {
  try {
    if (numberLayerContext?.protectedByNeighbor === true || hasProtectiveQuantityLabel(fullText, start) || isVisiblyStructuredNumericIdentifier(fullText, start, end)) {
      return true;
    }

    if ((!ignoreRangeSeparator && isNumberPartOfCodeToken(fullText, start, end)) || isNumberInsideDateLikeToken(fullText, start, end) || isNumberInsideFullDate(fullText, start, end) || isNumberPartOfMaskedSecret(fullText, start, integerPart)) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("[Чистовик] Failed to protect evidence-based number", error);
    throw error;
  }
}

function formatEvidenceBasedNumberToken(token: string): string {
  try {
    const commaIndex = token.indexOf(",");
    const integerPart = commaIndex === -1 ? token : token.slice(0, commaIndex);
    const decimalPart = commaIndex === -1 ? "" : token.slice(commaIndex);
    const compactInteger = integerPart.replace(/[ \t\u00A0\u2009\u202F]/g, "");

    if (compactInteger.length < 4) {
      return token;
    }

    return `${groupLongNumber(compactInteger)}${decimalPart}`;
  } catch (error) {
    console.error("[Чистовик] Failed to format evidence-based number token", error);
    throw error;
  }
}

function formatSharedQuantityConstructions(input: string, numberLayerContext: NumberLayerContext | null = null): string {
  try {
    const numberToken = QUANTITY_NUMBER_TOKEN_PATTERN;
    let text = input;

    text = text.replace(LEADING_CURRENCY_RANGE_PATTERN, (match: string, firstCurrency: string, first: string, secondCurrency: string, second: string, offset: number, fullText: string) => {
      try {
        const firstOffset = match.indexOf(first);
        const secondOffset = match.lastIndexOf(second);
        const firstStart = offset + firstOffset + first.search(/\d/);
        const secondStart = offset + secondOffset + second.search(/\d/);
        const firstInteger = first.replace(/^[+−-]/, "").split(",")[0].replace(/[ \t\u00A0\u2009\u202F]/g, "");
        const secondInteger = second.replace(/^[+−-]/, "").split(",")[0].replace(/[ \t\u00A0\u2009\u202F]/g, "");

        if (
          shouldProtectEvidenceBasedNumber(fullText, firstStart, firstStart + firstInteger.length, firstInteger, numberLayerContext, true) ||
          shouldProtectEvidenceBasedNumber(fullText, secondStart, secondStart + secondInteger.length, secondInteger, numberLayerContext, true)
        ) {
          return match;
        }

        const firstSign = /^[+−-]/.exec(first)?.[0] ?? "";
        const secondSign = /^[+−-]/.exec(second)?.[0] ?? "";
        const formattedFirst = `${firstSign}${formatEvidenceBasedNumberToken(first.slice(firstSign.length))}`;
        const formattedSecond = `${secondSign}${formatEvidenceBasedNumberToken(second.slice(secondSign.length))}`;

        if (firstCurrency === secondCurrency) {
          return `${formattedFirst}${NBSP}${EM_DASH} ${formattedSecond}${NBSP}${secondCurrency}`;
        }

        return `${formattedFirst}${NBSP}${firstCurrency}${NBSP}${EM_DASH} ${formattedSecond}${NBSP}${secondCurrency}`;
      } catch (error) {
        console.error("[Чистовик] Failed to format leading currency range", error);
        return match;
      }
    });

    const rangePattern = new RegExp(`(${numberToken})[ \\t\\u00A0]*(?:—|–|-|−)[ \\t\\u00A0]*(${numberToken})`, "g");

    text = text.replace(rangePattern, (match: string, first: string, second: string, offset: number, fullText: string) => {
      try {
        const firstDigitsOffset = first.search(/\d/);
        const firstStart = offset + firstDigitsOffset;
        const secondOffset = match.lastIndexOf(second);
        const secondDigitsOffset = second.search(/\d/);
        const secondStart = offset + secondOffset + secondDigitsOffset;
        const constructionEnd = offset + match.length;

        if (getQuantityEvidenceAfter(fullText, constructionEnd) === null && (numberLayerContext?.evidenceAfter ?? numberLayerContext?.evidenceBefore ?? null) === null) {
          return match;
        }

        const firstInteger = first.replace(/^[+−-]/, "").split(",")[0].replace(/[ \t\u00A0\u2009\u202F]/g, "");
        const secondInteger = second.replace(/^[+−-]/, "").split(",")[0].replace(/[ \t\u00A0\u2009\u202F]/g, "");

        if (shouldProtectEvidenceBasedNumber(fullText, firstStart, firstStart + firstInteger.length, firstInteger, numberLayerContext, true) || shouldProtectEvidenceBasedNumber(fullText, secondStart, secondStart + secondInteger.length, secondInteger, numberLayerContext, true)) {
          return match;
        }

        const firstSign = /^[+−-]/.exec(first)?.[0] ?? "";
        const secondSign = /^[+−-]/.exec(second)?.[0] ?? "";
        return `${firstSign}${formatEvidenceBasedNumberToken(first.slice(firstSign.length))}${EM_DASH}${secondSign}${formatEvidenceBasedNumberToken(second.slice(secondSign.length))}`;
      } catch (error) {
        console.error("[Чистовик] Failed to format shared quantity range", error);
        return match;
      }
    });

    const wordRangePattern = new RegExp(`\\b(от|с)[ \\t\\u00A0]+(${numberToken})[ \\t\\u00A0]+(до|по)[ \\t\\u00A0]+(${numberToken})`, "gi");
    text = text.replace(wordRangePattern, (match: string, fromWord: string, first: string, toWord: string, second: string, offset: number, fullText: string) => {
      try {
        if (getQuantityEvidenceAfter(fullText, offset + match.length) === null && (numberLayerContext?.evidenceAfter ?? numberLayerContext?.evidenceBefore ?? null) === null) {
          return match;
        }

        return `${fromWord} ${formatEvidenceBasedNumberToken(first)} ${toWord} ${formatEvidenceBasedNumberToken(second)}`;
      } catch (error) {
        console.error("[Чистовик] Failed to format shared word quantity range", error);
        return match;
      }
    });

    const listPattern = new RegExp(`(${numberToken})(?:(,[ \\t\\u00A0]+|;[ \\t\\u00A0]+|[ \\t\\u00A0]+(?:и|или)[ \\t\\u00A0]+)(${numberToken})){1,}`, "gi");
    text = text.replace(listPattern, (match: string, _first: string, _separator: string, _last: string, offset: number, fullText: string) => {
      try {
        if (getQuantityEvidenceAfter(fullText, offset + match.length) === null && (numberLayerContext?.evidenceAfter ?? numberLayerContext?.evidenceBefore ?? null) === null) {
          return match;
        }

        let protectedMember = false;
        match.replace(/[+−-]?(\d+(?:[ \t\u00A0\u2009\u202F]\d{3})*)(?:,\d+)?/g, (numberMatch: string, integer: string, numberOffset: number) => {
          const digitOffset = numberMatch.search(/\d/);
          const compactInteger = integer.replace(/[ \t\u00A0\u2009\u202F]/g, "");
          const start = offset + numberOffset + digitOffset;

          if (shouldProtectEvidenceBasedNumber(fullText, start, start + compactInteger.length, compactInteger, numberLayerContext)) {
            protectedMember = true;
          }

          return numberMatch;
        });

        if (protectedMember) {
          return match;
        }

        return match.replace(/[+−-]?(?:\d+(?:[ \t\u00A0\u2009\u202F]\d{3})*)(?:,\d+)?/g, (numberMatch: string) => {
          const sign = /^[+−-]/.exec(numberMatch)?.[0] ?? "";
          return `${sign}${formatEvidenceBasedNumberToken(numberMatch.slice(sign.length))}`;
        });
      } catch (error) {
        console.error("[Чистовик] Failed to format shared quantity list", error);
        return match;
      }
    });

    return text;
  } catch (error) {
    console.error("[Чистовик] Failed to format shared quantity constructions", error);
    throw error;
  }
}

function formatQuantitativeMathExpressions(input: string): string {
  try {
    const expressionPattern = /(?:^|[^A-Za-zА-Яа-яЁё\d_])([+−-]?\d+(?:[.,]\d+)?(?:[ \t\u00A0]*(?:\+|−|-|±|\/|÷|×|x|х|:|·)[ \t\u00A0]*[+−-]?\d+(?:[.,]\d+)?)*[ \t\u00A0]*=[ \t\u00A0]*[+−-]?\d+(?:[.,]\d+)?(?:[ \t\u00A0]*(?:\+|−|-|±|\/|÷|×|x|х|:|·)[ \t\u00A0]*[+−-]?\d+(?:[.,]\d+)?)*)/g;

    return input.replace(expressionPattern, (match: string, expression: string) => {
      try {
        const prefix = match.slice(0, match.length - expression.length);
        const formatted = expression.replace(/\d{4,}(?:,\d+)?/g, (numberMatch: string) => formatEvidenceBasedNumberToken(numberMatch));
        return `${prefix}${formatted}`;
      } catch (error) {
        console.error("[Чистовик] Failed to format quantitative math expression", error);
        return match;
      }
    });
  } catch (error) {
    console.error("[Чистовик] Failed to format quantitative math expressions", error);
    throw error;
  }
}

function formatNumbersAndMoney(input: string, ruleAnalyticsCollector: TypographyRuleAnalyticsCollector | null = null, numberLayerContext: NumberLayerContext | null = null): string {
  try {
    let text = applyTypographyRule(ruleAnalyticsCollector, "number_protect_date", input, normalizeCommaSeparatedDates);
    text = applyTypographyRule(ruleAnalyticsCollector, "number_document_outline", text, normalizeDottedNumberingSeparators);
    text = applyTypographyRule(ruleAnalyticsCollector, "number_western_format", text, (value) => normalizeWesternGroupedNumbers(value, numberLayerContext));

    text = applyTypographyRule(ruleAnalyticsCollector, "number_decimal_comma", text, (value) =>
      value.replace(/\b(\d+)\.(\d+)\b/g, (match, integerPart: string, decimalPart: string, offset: number, fullText: string) => {
        try {
          if (isProtectedDottedNumber(fullText, offset, offset + match.length) || getQuantityEvidence(fullText, offset, offset + match.length, numberLayerContext) === null) {
            recordProtectedDottedNumberRuleObservations(ruleAnalyticsCollector, fullText, offset, offset + match.length);
            return match;
          }

          return `${integerPart},${decimalPart}`;
        } catch (error) {
          console.error("[Чистовик] Failed to format decimal number", error);
          return match;
        }
      })
    );

    text = applyTypographyRule(ruleAnalyticsCollector, "number_group_digits", text, formatQuantitativeMathExpressions);
    text = applyTypographyRule(ruleAnalyticsCollector, "number_group_digits", text, (value) => formatSharedQuantityConstructions(value, numberLayerContext));

    text = applyTypographyRule(ruleAnalyticsCollector, "number_group_digits", text, (value) =>
      value.replace(/\b(?:\d{4,}|\d{1,3}(?:[ \t\u00A0\u2009\u202F]\d{3})+)(?:,\d+)?\b/g, (match: string, offset: number, fullText: string) => {
        try {
          const integerPart = match.split(",")[0].replace(/[ \t\u00A0\u2009\u202F]/g, "");
          const evidence = getQuantityEvidence(fullText, offset, offset + match.length, numberLayerContext);

          if (
            evidence === null ||
            (evidence.kind !== "currency" && isCompactRussianPhoneDigits(integerPart)) ||
            isNumberPartOfDate(fullText, offset, offset + integerPart.length) ||
            shouldProtectEvidenceBasedNumber(fullText, offset, offset + match.length, integerPart, numberLayerContext)
          ) {
            recordProtectedGroupedNumberRuleObservations(ruleAnalyticsCollector, fullText, offset, offset + integerPart.length);
            return match;
          }

          return formatEvidenceBasedNumberToken(match);
        } catch (error) {
          console.error("[Чистовик] Failed to group number", error);
          return match;
        }
      })
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "number_unit_currency_nbsp", text, (value) =>
      value.replace(
        new RegExp(`(\\d(?:[\\d \\u00A0\\u2009\\u202F]*\\d)?(?:,\\d+)?)[ \\t\\u00A0\\u2009\\u202F]*([${QUANTITY_CURRENCY_SYMBOLS}]|км|кг|м)(?=$|[^${LETTERS}])`, "g"),
        `$1${NBSP}$2`
      )
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "number_unit_currency_nbsp", text, (value) =>
      value.replace(
        new RegExp(`(\\d(?:[\\d \\u00A0\\u2009\\u202F]*\\d)?(?:,\\d+)?)[ \\t\\u00A0\\u2009\\u202F]+(${QUANTITY_SCALE_PATTERN})[ \\t\\u00A0\\u2009\\u202F]*([${QUANTITY_CURRENCY_SYMBOLS}])(?=$|[^${LETTERS}])`, "gi"),
        `$1${NBSP}$2${NBSP}$3`
      )
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "number_unit_currency_nbsp", text, normalizeTechnicalMeasurementUnits);
    return applyTypographyRule(ruleAnalyticsCollector, "year_context", text, normalizeSpacedYears);
  } catch (error) {
    console.error("[Чистовик] Failed to format numbers and money", error);
    throw error;
  }
}

function normalizeTechnicalMeasurementUnits(input: string): string {
  try {
    return input.replace(/(^|[^A-Za-zА-Яа-яЁё\d.,])(\d(?:[\d \u00A0]*\d)?(?:,\d+)?)[ \t\u00A0]*(квт|вт|в|dpi|lpi)(?=$|[^A-Za-zА-Яа-яЁё\d])/gi, (_match: string, prefix: string, number: string, unit: string) => {
      try {
        return `${prefix}${number}${NBSP}${getCanonicalTechnicalMeasurementUnit(unit)}`;
      } catch (error) {
        console.error("[Чистовик] Failed to normalize technical measurement unit candidate", error);
        return _match;
      }
    });
  } catch (error) {
    console.error("[Чистовик] Failed to normalize technical measurement units", error);
    throw error;
  }
}

function getCanonicalTechnicalMeasurementUnit(unit: string): string {
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
  } catch (error) {
    console.error("[Чистовик] Failed to get canonical technical measurement unit", error);
    throw error;
  }
}

function normalizeCommaSeparatedDates(input: string): string {
  try {
    return input.replace(/(^|[^A-Za-zА-Яа-яЁё\d.,])(\d{1,2}),(\d{2}),([12]\d{3})(?![\d,]|\.\d|[A-Za-zА-Яа-яЁё])/g, (match: string, prefix: string, day: string, month: string, year: string) => {
      try {
        if (!isValidCalendarDate(Number(day), Number(month), Number(year))) {
          return match;
        }

        return `${prefix}${day}.${month}.${year}`;
      } catch (error) {
        console.error("[Чистовик] Failed to normalize comma-separated date candidate", error);
        return match;
      }
    });
  } catch (error) {
    console.error("[Чистовик] Failed to normalize comma-separated dates", error);
    throw error;
  }
}

function isValidCalendarDate(day: number, month: number, year: number): boolean {
  try {
    if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year) || year < 1000 || year > 2999 || month < 1 || month > 12 || day < 1) {
      return false;
    }

    const leapYear = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
    const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    return day <= daysInMonth[month - 1];
  } catch (error) {
    console.error("[Чистовик] Failed to validate calendar date", error);
    throw error;
  }
}

function normalizeDottedNumberingSeparators(input: string): string {
  try {
    return input.replace(/\b\d+(?:,\d+)+\b/g, (match: string, offset: number, fullText: string) => {
      try {
        if (!isDottedNumbering(fullText, offset, offset + match.length)) {
          return match;
        }

        return match.replace(/,/g, ".");
      } catch (error) {
        console.error("[Чистовик] Failed to restore dotted numbering separator", error);
        return match;
      }
    });
  } catch (error) {
    console.error("[Чистовик] Failed to restore dotted numbering separators", error);
    throw error;
  }
}

function normalizeWesternGroupedNumbers(input: string, numberLayerContext: NumberLayerContext | null = null): string {
  try {
    return input.replace(/(^|[^\d])(\d{1,3}(?:,\d{3})+(?:\.\d+)?)(?=$|[^\d])/g, (match, prefix: string, candidate: string, offset: number, fullText: string) => {
      try {
        const candidateStart = offset + prefix.length;
        const [integerPart, decimalPart] = candidate.split(".");
        const compactInteger = integerPart.replace(/,/g, "");
        const evidence = getQuantityEvidence(fullText, candidateStart, candidateStart + candidate.length, numberLayerContext);
        const commaGroups = countMatches(integerPart, /,/g);

        if (evidence?.kind !== "currency" || (commaGroups < 2 && decimalPart === undefined) || shouldProtectEvidenceBasedNumber(fullText, candidateStart, candidateStart + candidate.length, compactInteger, numberLayerContext)) {
          return match;
        }

        return `${prefix}${integerPart.replace(/,/g, NBSP)}${decimalPart === undefined ? "" : `,${decimalPart}`}`;
      } catch (error) {
        console.error("[Чистовик] Failed to normalize western grouped number candidate", error);
        return match;
      }
    });
  } catch (error) {
    console.error("[Чистовик] Failed to normalize western grouped numbers", error);
    throw error;
  }
}

function normalizeGroupedNumberSpaces(input: string): string {
  try {
    return input.replace(/\b\d{1,3}(?:[ \t\u00A0]\d{3})+(?:,\d+)?\b/g, (match: string, offset: number, fullText: string) => {
      try {
        const compactInteger = match.split(",")[0].replace(/[ \t\u00A0]/g, "");

        if (shouldSkipNumberGrouping(fullText, offset, offset + match.length, compactInteger)) {
          return match;
        }

        return match.replace(/[ \t\u00A0](?=\d{3}(?:[ \t\u00A0,]|$))/g, NBSP);
      } catch (error) {
        console.error("[Чистовик] Failed to normalize grouped number candidate", error);
        return match;
      }
    });
  } catch (error) {
    console.error("[Чистовик] Failed to normalize grouped number spaces", error);
    throw error;
  }
}

function isProtectedDottedNumber(fullText: string, start: number, end: number): boolean {
  try {
    if (
      isNumberPartOfCodeToken(fullText, start, end) ||
      isNumberInsideDateLikeToken(fullText, start, end) ||
      isNumberPartOfDate(fullText, start, end) ||
      isDottedNumbering(fullText, start, end)
    ) {
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
  } catch (error) {
    console.error("[Чистовик] Failed to check dotted number exception", error);
    throw error;
  }
}

function recordProtectedDottedNumberRuleObservations(
  collector: TypographyRuleAnalyticsCollector | null,
  fullText: string,
  start: number,
  end: number
): void {
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
  } catch {
    // Rule analytics must never affect typography.
  }
}

function recordProtectedGroupedNumberRuleObservations(
  collector: TypographyRuleAnalyticsCollector | null,
  fullText: string,
  start: number,
  end: number
): void {
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
  } catch {
    // Rule analytics must never affect typography.
  }
}

function isNumberInsideDateLikeToken(fullText: string, start: number, end: number): boolean {
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
  } catch (error) {
    console.error("[Чистовик] Failed to check date-like numeric token", error);
    throw error;
  }
}

function isDottedNumbering(fullText: string, start: number, end: number): boolean {
  try {
    const textBeforeNumber = fullText.slice(0, start);
    const documentNumberingContext =
      /(?:^|[^A-Za-zА-Яа-яЁё])(?:раздел|подраздел|глава|пункт|подпункт|статья|часть|гл\.?|п\.?|ст\.?|ч\.?|§|№)[ \t\u00A0]*$/i;

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
  } catch (error) {
    console.error("[Чистовик] Failed to check dotted numbering", error);
    throw error;
  }
}

function isNumberPartOfDate(fullText: string, start: number, end: number): boolean {
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
  } catch (error) {
    console.error("[Чистовик] Failed to check date token", error);
    throw error;
  }
}

function getDottedNumberTokenBounds(fullText: string, start: number, end: number): { start: number; end: number } | null {
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
  } catch (error) {
    console.error("[Чистовик] Failed to get dotted number token bounds", error);
    throw error;
  }
}

function isDateToken(token: string): boolean {
  try {
    const match = /^(\d{1,2})\.(\d{2})(?:\.(\d{4}))?$/.exec(token);

    if (match === null) {
      return false;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = match[3] === undefined ? null : Number(match[3]);

    return day >= 1 && day <= 31 && month >= 1 && month <= 12 && (year === null || (year >= 1000 && year <= 2999));
  } catch (error) {
    console.error("[Чистовик] Failed to check date token format", error);
    throw error;
  }
}

function isShortDateToken(token: string): boolean {
  try {
    return /^\d{1,2}\.\d{2}$/.test(token) && isDateToken(token);
  } catch (error) {
    console.error("[Чистовик] Failed to check short date token", error);
    throw error;
  }
}

function isFollowedByDecimalUnitOrCurrency(fullText: string, index: number): boolean {
  try {
    const after = fullText.slice(index);
    const match = /^[ \t\u00A0]*(₽|\$|€|%|руб\.?|коп\.?|тыс\.?|млн|млрд|трлн|квт|вт|dpi|lpi|км|кг|мм|см|мл|м|г\.?|л|шт\.?|сек\.?|мин\.?|мес\.?|с|кв\.?|куб\.?)(?=$|[^A-Za-zА-Яа-яЁё])/i.exec(after);

    return match !== null;
  } catch (error) {
    console.error("[Чистовик] Failed to check decimal unit or currency", error);
    throw error;
  }
}

function normalizeSpacedYears(input: string): string {
  try {
    return input
      .replace(/(\b\d{1,2}\.\d{2}\.)([12])[ \t\u00A0](\d{3})\b/g, "$1$2$3")
      .replace(/(^|[^\d])([12])[ \t\u00A0](\d{3})(?=[ \t\u00A0]*(?:г\.?|год|году|года)(?=$|[^A-Za-zА-Яа-яЁё]))/gi, "$1$2$3")
      .replace(/(©[ \t\u00A0]*)([12])[ \t\u00A0](\d{3})\b/g, "$1$2$3")
      .replace(/(\b[A-Za-z][A-Za-z\d._-]*\*[12])[ \t\u00A0](\d{3})\b/g, "$1$2");
  } catch (error) {
    console.error("[Чистовик] Failed to normalize spaced years", error);
    throw error;
  }
}

function shouldSkipNumberGrouping(fullText: string, start: number, end: number, integerPart: string): boolean {
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
  } catch (error) {
    console.error("[Чистовик] Failed to check number grouping exception", error);
    throw error;
  }
}

function previousNonSpaceSkippingDevelopmentMarker(input: string, index: number): string | null {
  try {
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      if (/[ \t\u00A0]/.test(input[cursor]) || input[cursor] === DEVELOPMENT_NBSP_MARKER) {
        continue;
      }

      return input[cursor];
    }

    return null;
  } catch (error) {
    console.error("[Чистовик] Failed to find previous non-space char skipping development marker", error);
    throw error;
  }
}

function isNumberAfterSignNumberPrefix(input: string, index: number): boolean {
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
  } catch (error) {
    console.error("[Чистовик] Failed to check number after sign number prefix", error);
    throw error;
  }
}

function findPreviousNonSpaceSkippingDevelopmentMarkerIndex(input: string, index: number): number {
  try {
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      if (/[ \t\u00A0]/.test(input[cursor]) || input[cursor] === DEVELOPMENT_NBSP_MARKER) {
        continue;
      }

      return cursor;
    }

    return -1;
  } catch (error) {
    console.error("[Чистовик] Failed to find previous non-space index skipping development marker", error);
    throw error;
  }
}

function isNumberPartOfMaskedSecret(fullText: string, start: number, integerPart: string): boolean {
  try {
    const before = fullText.slice(Math.max(0, start - 24), start);

    return (/^\d{4}$/.test(integerPart) && /[\*•]{2,}$/.test(before)) || /\*{2,}[\* \t\u00A0\-–—−]+$/.test(before);
  } catch (error) {
    console.error("[Чистовик] Failed to check masked secret number", error);
    throw error;
  }
}

function isInsideProtectedNumericIdentifier(input: string, start: number, end: number): boolean {
  try {
    const bounds = getNumericIdentifierTokenBounds(input, start, end);
    const token = input.slice(bounds.start, bounds.end);

    return isProtectedNumericIdentifierToken(token);
  } catch (error) {
    console.error("[Чистовик] Failed to check protected numeric identifier", error);
    throw error;
  }
}

function getNumericIdentifierTokenBounds(input: string, start: number, end: number): { start: number; end: number } {
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
  } catch (error) {
    console.error("[Чистовик] Failed to get numeric identifier token bounds", error);
    throw error;
  }
}

function isProtectedNumericIdentifierToken(token: string): boolean {
  try {
    return isPaymentCardNumberToken(token) || isPaymentAccountNumberToken(token) || isCardMaskToken(token);
  } catch (error) {
    console.error("[Чистовик] Failed to check protected numeric identifier token", error);
    throw error;
  }
}

function isPaymentCardNumberToken(token: string): boolean {
  try {
    const normalized = normalizeHorizontalSpaces(token);
    const digits = normalized.replace(/\D/g, "");

    if (digits.length < 16 || digits.length > 19) {
      return false;
    }

    return /^\d{16,19}$/.test(normalized) || /^\d{4}(?:[ \u00A0‑–—-]\d{4}){3}(?:[ \u00A0‑–—-]\d{1,3})?$/.test(normalized);
  } catch (error) {
    console.error("[Чистовик] Failed to check payment card number token", error);
    throw error;
  }
}

function isPaymentAccountNumberToken(token: string): boolean {
  try {
    const normalized = normalizeHorizontalSpaces(token);

    return /^\d{20}$/.test(normalized) || /^\d{4}(?:[ \u00A0‑–—-]\d{4}){4}$/.test(normalized);
  } catch (error) {
    console.error("[Чистовик] Failed to check payment account number token", error);
    throw error;
  }
}

function isCardMaskToken(token: string): boolean {
  try {
    return /^[\*•]{2,}\d{4}$/.test(normalizeHorizontalSpaces(token));
  } catch (error) {
    console.error("[Чистовик] Failed to check card mask token", error);
    throw error;
  }
}

function normalizeHorizontalSpaces(input: string): string {
  try {
    return input.replace(/[\t\u00A0]/g, " ");
  } catch (error) {
    console.error("[Чистовик] Failed to normalize horizontal spaces", error);
    throw error;
  }
}

function isNumberInsideFullDate(fullText: string, start: number, end: number): boolean {
  try {
    const before = fullText.slice(Math.max(0, start - 6), start);

    return /\d{1,2}\.\d{2}\.$/.test(before);
  } catch (error) {
    console.error("[Чистовик] Failed to check full date number", error);
    throw error;
  }
}

function isNumberPartOfCodeToken(fullText: string, start: number, end: number): boolean {
  try {
    const previous = fullText[start - 1] ?? "";

    if (isCodeTokenNeighbor(previous) || isCodeTokenNeighbor(fullText[end] ?? "")) {
      return true;
    }

    if (previous === DEVELOPMENT_NBSP_MARKER) {
      const previousSkippingMarker = previousNonSpaceSkippingDevelopmentMarker(fullText, start);

      return previousSkippingMarker !== null && /[A-Za-z]/.test(previousSkippingMarker);
    }

    return false;
  } catch (error) {
    console.error("[Чистовик] Failed to check code token number", error);
    throw error;
  }
}

function isCodeTokenNeighbor(char: string): boolean {
  try {
    return /^[A-Za-zА-Яа-яЁё]$/.test(char) || char === "-" || char === EN_DASH || char === EM_DASH || char === NB_HYPHEN;
  } catch (error) {
    console.error("[Чистовик] Failed to check code token neighbor", error);
    throw error;
  }
}

function groupLongNumber(value: string): string {
  try {
    if (value.length <= 3) {
      return value;
    }

    const firstGroupLength = value.length % 3 || 3;
    const groups = [value.slice(0, firstGroupLength)];

    for (let index = firstGroupLength; index < value.length; index += 3) {
      groups.push(value.slice(index, index + 3));
    }

    return groups.join(NBSP);
  } catch (error) {
    console.error("[Чистовик] Failed to group long number", error);
    throw error;
  }
}

function normalizeAbbreviations(input: string, ruleAnalyticsCollector: TypographyRuleAnalyticsCollector | null = null): string {
  try {
    let text = input;

    text = applyTypographyRule(ruleAnalyticsCollector, "abbr_month", text, (value) =>
      value.replace(/([₽$€])[ \t\u00A0]*\/[ \t\u00A0]*мес\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (match: string, currency: string, offset: number, fullText: string) => {
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
        } catch (error) {
          console.error("[Чистовик] Failed to normalize currency per month", error);
          return match;
        }
      })
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "abbr_compound", text, (value) =>
      value
        .replace(/(^|[^A-Za-zА-Яа-яЁё])(и)[ \t\u00A0]+(т)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(д)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match: string, prefix: string, first: string, second: string, third: string) => `${prefix}${first}${NBSP}${second}.${NBSP}${third}.`)
        .replace(/(^|[^A-Za-zА-Яа-яЁё])(и)[ \t\u00A0]+(т)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(п)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match: string, prefix: string, first: string, second: string, third: string) => `${prefix}${first}${NBSP}${second}.${NBSP}${third}.`)
        .replace(/(^|[^A-Za-zА-Яа-яЁё])(и)[ \t\u00A0]+(др)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match: string, prefix: string, first: string, second: string) => `${prefix}${first}${NBSP}${second}.`)
        .replace(/(^|[^A-Za-zА-Яа-яЁё])(в)[ \t\u00A0]+(т)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(ч)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match: string, prefix: string, first: string, second: string, third: string) => `${prefix}${first}${NBSP}${second}.${NBSP}${third}.`)
        .replace(/(^|[^A-Za-zА-Яа-яЁё])(н)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(в)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match: string, prefix: string, first: string, second: string) => `${prefix}${first}.${NBSP}${second}.`)
        .replace(/(^|[^A-Za-zА-Яа-яЁё])(т)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(е)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match: string, prefix: string, first: string, second: string) => `${prefix}${first}.${NBSP}${second}.`)
        .replace(/(^|[^A-Za-zА-Яа-яЁё])(т)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(к)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match: string, prefix: string, first: string, second: string) => `${prefix}${first}.${NBSP}${second}.`)
        .replace(/(^|[^A-Za-zА-Яа-яЁё])(т)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(д)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match: string, prefix: string, first: string, second: string) => `${prefix}${first}.${NBSP}${second}.`)
        .replace(/(^|[^A-Za-zА-Яа-яЁё])(т)(?:[ \t\u00A0]*\.[ \t\u00A0]*|[ \t\u00A0]+)(п)\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (_match: string, prefix: string, first: string, second: string) => `${prefix}${first}.${NBSP}${second}.`)
        .replace(/(^|[^A-Za-zА-Яа-яЁё])p[ \t\u00A0]*\.?[ \t\u00A0]*p[ \t\u00A0]*\.?[ \t\u00A0]*s\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1P.${NBSP}P.${NBSP}S.`)
        .replace(/(^|[^A-Za-zА-Яа-яЁё])p[ \t\u00A0]*\.?[ \t\u00A0]*s\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1P.${NBSP}S.`)
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "abbr_area_volume", text, (value) =>
      value
        .replace(/(^|[^A-Za-zА-Яа-яЁё])кв\.?[ \t\u00A0]*м\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1кв.${NBSP}м`)
        .replace(/(^|[^A-Za-zА-Яа-яЁё])куб\.?[ \t\u00A0]*м\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, `$1куб.${NBSP}м`)
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "abbr_dotted", text, normalizeSlashSeparatedAbbreviationDots);
    text = applyTypographyRule(ruleAnalyticsCollector, "abbr_dotted", text, (value) =>
      value.replace(new RegExp(`(^|[^${LETTERS}])(${DOTTED_ABBREVIATIONS})\\.?(?=$|[^${LETTERS}\\-${NB_HYPHEN}])`, "gi"), (match: string, prefix: string, abbreviation: string, offset: number, fullText: string) => {
        try {
          const abbreviationStart = offset + prefix.length;
          const abbreviationEnd = abbreviationStart + abbreviation.length;

          if (isSlashSeparatedAbbreviationPart(fullText, abbreviationStart, abbreviationEnd)) {
            return match;
          }

          return `${prefix}${abbreviation}.`;
        } catch (error) {
          console.error("[Чистовик] Failed to normalize dotted abbreviation candidate", error);
          return match;
        }
      })
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "abbr_dotted", text, (value) =>
      value.replace(new RegExp(`(^|[^${LETTERS}])(под)(?=\\.|[ \\t\\u00A0]+\\d)(\\.?)`, "gi"), "$1$2.")
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "abbr_undotted_hyphenated", text, (value) =>
      value.replace(new RegExp(`(^|[^${LETTERS}])(б[-${NB_HYPHEN}]р|пр[-${NB_HYPHEN}]т)\\.?(?=$|[^${LETTERS}])`, "gi"), "$1$2")
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "abbr_month", text, (value) =>
      value.replace(/(^|[^A-Za-zА-Яа-яЁё])мес\.?(?=$|[^A-Za-zА-Яа-яЁё])/gi, (match: string, prefix: string, offset: number, fullText: string) => {
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
      } catch (error) {
        console.error("[Чистовик] Failed to normalize мес", error);
        return match;
      }
      })
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "abbr_undotted_large_number", text, (value) =>
      value.replace(/(^|[^A-Za-zА-Яа-яЁё])(млн|млрд|трлн)\.(?=$|[^A-Za-zА-Яа-яЁё])/gi, (match: string, prefix: string, abbreviation: string, offset: number, fullText: string) => {
      try {
        const periodIndex = offset + match.length - 1;

        if (isSameLineSentenceContinuation(fullText, periodIndex)) {
          recordAbbreviationPeriodRuleObservation(ruleAnalyticsCollector, fullText, periodIndex, true);
          return `${prefix}${abbreviation}.`;
        }

        recordAbbreviationPeriodRuleObservation(ruleAnalyticsCollector, fullText, periodIndex, false);
        return `${prefix}${abbreviation}`;
      } catch (error) {
        console.error("[Чистовик] Failed to normalize large number abbreviation period", error);
        return match;
      }
      })
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "abbr_undotted_units", text, (value) =>
      value.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?[ \t\u00A0]+)(квт|вт|в|dpi|lpi|км|кг|м|с|мм|см|л|мл)\.(?=$|[^A-Za-zА-Яа-яЁё])/gi, (match: string, numberWithSpace: string, unit: string, offset: number, fullText: string) => {
      try {
        const periodIndex = offset + match.length - 1;
        const normalizedUnit = getCanonicalTechnicalMeasurementUnit(unit);

        if (isSameLineSentenceContinuation(fullText, periodIndex)) {
          recordAbbreviationPeriodRuleObservation(ruleAnalyticsCollector, fullText, periodIndex, true);
          return `${numberWithSpace}${normalizedUnit}.`;
        }

        recordAbbreviationPeriodRuleObservation(ruleAnalyticsCollector, fullText, periodIndex, false);
        return `${numberWithSpace}${normalizedUnit}`;
      } catch (error) {
        console.error("[Чистовик] Failed to normalize unit period", error);
        return match;
      }
      })
    );

    return text;
  } catch (error) {
    console.error("[Чистовик] Failed to normalize abbreviations", error);
    throw error;
  }
}

function recordAbbreviationPeriodRuleObservation(
  collector: TypographyRuleAnalyticsCollector | null,
  fullText: string,
  periodIndex: number,
  preservedAsSentenceEnd: boolean
): void {
  try {
    if (preservedAsSentenceEnd) {
      recordTypographyRuleObservation(collector, "abbr_sentence_end");
      return;
    }

    if (/^[ \t\u00A0]*[\r\n]/.test(fullText.slice(periodIndex + 1))) {
      recordTypographyRuleDerivedChange(collector, "abbr_line_break");
    }
  } catch {
    // Rule analytics must never affect typography.
  }
}

function isSentenceEndingPeriod(fullText: string, periodIndex: number): boolean {
  try {
    const after = fullText.slice(periodIndex + 1);

    return after.length === 0 || /^[ \t\u00A0]*$/.test(after) || /^[ \t\u00A0]+[A-ZА-ЯЁ]/.test(after);
  } catch (error) {
    console.error("[Чистовик] Failed to check sentence-ending period", error);
    throw error;
  }
}

function isSameLineSentenceContinuation(fullText: string, periodIndex: number): boolean {
  try {
    const after = fullText.slice(periodIndex + 1);

    return /^[ \t\u00A0]+[A-ZА-ЯЁ]/.test(after);
  } catch (error) {
    console.error("[Чистовик] Failed to check same-line sentence continuation", error);
    throw error;
  }
}

function normalizeSlashSeparatedAbbreviationDots(input: string): string {
  try {
    return input
      .replace(
        new RegExp(`(^|[^${LETTERS}])([А-Яа-яЁё]{1,4})\\.(?=[ \\t\\u00A0]*\\/[ \\t\\u00A0]*[А-Яа-яЁё])`, "g"),
        (match: string, prefix: string, abbreviation: string, offset: number, fullText: string) => {
          try {
            if (abbreviation.length === 1 && isPersonInitialBeforeSlash(fullText, offset + prefix.length)) {
              return match;
            }

            return `${prefix}${abbreviation}`;
          } catch (error) {
            console.error("[Чистовик] Failed to normalize abbreviation dot before slash", error);
            return match;
          }
        }
      )
      .replace(new RegExp(`(^|[^${LETTERS}])((?:[А-Яа-яЁё]{1,4}[ \\t\\u00A0]*\\/[ \\t\\u00A0]*)+[А-Яа-яЁё]{1,4})\\.(?=[ \\t\\u00A0]+[а-яё])`, "g"), (match: string, prefix: string, slashAbbreviation: string, offset: number, fullText: string) => {
        try {
          const dotIndex = offset + match.length - 1;

          if (isSlashSeparatedAreaUnitAbbreviation(fullText, slashAbbreviation, dotIndex)) {
            return match;
          }

          return `${prefix}${slashAbbreviation}`;
        } catch (error) {
          console.error("[Чистовик] Failed to normalize slash-separated abbreviation dot candidate", error);
          return match;
        }
      });
  } catch (error) {
    console.error("[Чистовик] Failed to normalize slash-separated abbreviation dots", error);
    throw error;
  }
}

function isPersonInitialBeforeSlash(fullText: string, initialIndex: number): boolean {
  try {
    return new RegExp(`[А-ЯЁ][а-яё]+[ \\t\\u00A0]+$`).test(fullText.slice(0, initialIndex));
  } catch (error) {
    console.error("[Чистовик] Failed to check person initial before slash", error);
    throw error;
  }
}

function isSlashSeparatedAreaUnitAbbreviation(fullText: string, slashAbbreviation: string, dotIndex: number): boolean {
  try {
    return /\/[ \t\u00A0]*(кв|куб)$/i.test(slashAbbreviation) &&
      /^[ \t\u00A0]+м(?=$|[^A-Za-zА-Яа-яЁё])/.test(fullText.slice(dotIndex + 1));
  } catch (error) {
    console.error("[Чистовик] Failed to check slash-separated area unit abbreviation", error);
    throw error;
  }
}

function isSlashSeparatedAbbreviationPart(fullText: string, abbreviationStart: number, abbreviationEnd: number): boolean {
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
  } catch (error) {
    console.error("[Чистовик] Failed to check slash-separated abbreviation part", error);
    throw error;
  }
}

function findPreviousHorizontalNonSpaceIndex(input: string, index: number): number {
  try {
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      if (/[ \t\u00A0]/.test(input[cursor])) {
        continue;
      }

      return cursor;
    }

    return -1;
  } catch (error) {
    console.error("[Чистовик] Failed to find previous horizontal non-space index", error);
    throw error;
  }
}

function findNextHorizontalNonSpaceIndex(input: string, index: number): number {
  try {
    for (let cursor = index; cursor < input.length; cursor += 1) {
      if (/[ \t\u00A0]/.test(input[cursor])) {
        continue;
      }

      return cursor;
    }

    return -1;
  } catch (error) {
    console.error("[Чистовик] Failed to find next horizontal non-space index", error);
    throw error;
  }
}

function applyNonBreakingSpaces(input: string, ruleAnalyticsCollector: TypographyRuleAnalyticsCollector | null = null): string {
  try {
    let text = input;

    const beforeDash = text;
    text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_before_dash", text, (value) => value.replace(/[ \t\u00A0]+—/g, `${NBSP}${EM_DASH}`));

    if (text !== beforeDash) {
      recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "dash_nbsp_before");
    }

    text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_particles", text, applyParticleNonBreakingSpaces);
    text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_short_cyrillic_words", text, applyShortWordNonBreakingSpaces);
    text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_initials", text, (value) =>
      value
        .replace(/(^|[^А-ЯЁа-яё])([А-ЯЁ])\.[ \t\u00A0]*([А-ЯЁ])\.[ \t\u00A0]*(?=[А-ЯЁ][а-яё]+)/g, `$1$2.${NBSP}$3.${NBSP}`)
        .replace(/(^|[^А-ЯЁа-яё])([А-ЯЁ])\.[ \t\u00A0]*(?=[А-ЯЁ][а-яё]+)/g, `$1$2.${NBSP}`)
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_after_number_sign", text, (value) => value.replace(/([№§])[ \t\u00A0]*(?=\d)/g, `$1${NBSP}`));
    text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_copyright_year", text, (value) => value.replace(/(©)[ \t\u00A0]*(?=[12]\d{3}\b)/g, `$1${NBSP}`));
    text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_number_unit", text, (value) =>
      value.replace(/(^|[^A-Za-zА-Яа-яЁё])(д|г|стр|кв)\.[ \t\u00A0]*(?=\d)/gi, `$1$2.${NBSP}`)
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_percent_metric", text, applyWhitelistedPercentNonBreakingSpaces);
    text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_number_unit", text, (value) =>
      value.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?)[ \t]+([A-Za-zА-Яа-яЁё]+\.?)/g, (match: string, number: string, followingWord: string, offset: number, fullText: string) => {
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
        } catch (error) {
          console.error("[Чистовик] Failed to apply number non-breaking space", error);
          return match;
        }
      })
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "nbsp_number_unit", text, restoreSpacesAfterMeasurementUnits);

    return text;
  } catch (error) {
    console.error("[Чистовик] Failed to apply non-breaking spaces", error);
    throw error;
  }
}

function applyWhitelistedPercentNonBreakingSpaces(input: string): string {
  try {
    const percentValue = "\\d+(?:[.,]\\d+)?(?:—\\d+(?:[.,]\\d+)?)?%";
    const percentWordPattern = new RegExp(`(^|[^${LETTERS}\\d\\-${NB_HYPHEN}])(${PERCENT_WORD_WHITELIST_PATTERN})[ \\t\\u00A0]+(${percentValue})`, "gi");

    return input.replace(percentWordPattern, `$1$2${NBSP}$3`);
  } catch (error) {
    console.error("[Чистовик] Failed to apply whitelist percent non-breaking spaces", error);
    throw error;
  }
}

function shouldKeepNumberWithNextWord(fullText: string, start: number, end: number, number: string): boolean {
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
  } catch (error) {
    console.error("[Чистовик] Failed to check number follower", error);
    throw error;
  }
}

function isRangeEndBeforeMonth(fullText: string, start: number, followingText: string): boolean {
  try {
    const previous = previousNonSpaceSkippingDevelopmentMarker(fullText, start);

    if (previous !== EM_DASH) {
      return false;
    }

    return /^[ \t\u00A0]+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?=$|[^A-Za-zА-Яа-яЁё])/i.test(followingText);
  } catch (error) {
    console.error("[Чистовик] Failed to check range end before month", error);
    throw error;
  }
}

function hasPreviousNumberBindingAbbreviation(fullText: string, index: number): boolean {
  try {
    const before = fullText.slice(Math.max(0, index - 16), index);

    return /(?:^|[^A-Za-zА-Яа-яЁё])(д|г|стр|кв)\.[ \t\u00A0]*$/i.test(before);
  } catch (error) {
    console.error("[Чистовик] Failed to check number-binding abbreviation", error);
    throw error;
  }
}

function applyParticleNonBreakingSpaces(input: string): string {
  try {
    const particlePattern = new RegExp(`(^|\\S)[ \\t]+(ли|же|бы|ль|ж|б)(?=$|[^${LETTERS}\\-${NB_HYPHEN}])`, "gi");

    return input.replace(particlePattern, `$1${NBSP}$2`);
  } catch (error) {
    console.error("[Чистовик] Failed to apply particle non-breaking spaces", error);
    throw error;
  }
}

function applyShortWordNonBreakingSpaces(input: string): string {
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
  } catch (error) {
    console.error("[Чистовик] Failed to apply short word non-breaking spaces", error);
    throw error;
  }
}

function restoreSpacesAfterMeasurementUnits(input: string): string {
  try {
    return input.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?\u00A0(?:кВт|Вт|В|г|кг|м|км|мм|см|л|мл|с|dpi|lpi))\u00A0(?=[A-Za-zА-Яа-яЁё])/gi, "$1 ");
  } catch (error) {
    console.error("[Чистовик] Failed to restore spaces after measurement units", error);
    throw error;
  }
}

function normalizeMathAndSymbols(input: string, ruleAnalyticsCollector: TypographyRuleAnalyticsCollector | null = null): string {
  try {
    let text = applyTypographyRule(ruleAnalyticsCollector, "math_fractions", input, (value) =>
      value
        .replace(/(^|[^A-Za-zА-Яа-яЁё\d])1\/2($|[^A-Za-zА-Яа-яЁё\d])/g, "$1½$2")
        .replace(/(^|[^A-Za-zА-Яа-яЁё\d])1\/4($|[^A-Za-zА-Яа-яЁё\d])/g, "$1¼$2")
        .replace(/(^|[^A-Za-zА-Яа-яЁё\d])3\/4($|[^A-Za-zА-Яа-яЁё\d])/g, "$1¾$2")
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "math_subtraction_context", text, (value) =>
      value.replace(/(\d+(?:,\d+)?%)[ \t\u00A0]+[-–−][ \t\u00A0]+(\d+(?:,\d+)?%)/g, `$1${NBSP}${MINUS}${NBSP}$2`)
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "math_expression_spacing", text, (value) =>
      normalizeMathExpressions(value, ruleAnalyticsCollector)
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "math_negative_number", text, (value) =>
      value.replace(/(^|[^A-Za-zА-Яа-яЁё\d])([-–−])[ \t\u00A0]*(\d)/g, (match: string, prefix: string, _sign: string, digit: string, offset: number, fullText: string) => {
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
        } catch (error) {
          console.error("[Чистовик] Failed to normalize negative number", error);
          return match;
        }
      })
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "math_subtraction_context", text, (value) =>
      value.replace(/(\d+(?:,\d+)?%)[ \t\u00A0]+−(\d+(?:,\d+)?%)/g, `$1${NBSP}${MINUS}${NBSP}$2`)
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "temperature_scale", text, (value) =>
      value.replace(/(\d(?:[\d \u00A0]*\d)?)[ \t\u00A0]*°?[ \t\u00A0]*([CFС])\b/g, (_match, number: string, unit: string) => `${number}${NBSP}°${unit === "F" ? "F" : "C"}`)
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "temperature_degree_only", text, (value) =>
      value.replace(/(\d(?:[\d \u00A0]*\d)?(?:,\d+)?)[ \t\u00A0]+°(?![CFС]\b)/g, "$1°")
    );
    text = applyTypographyRule(ruleAnalyticsCollector, "symbol_legal_marks", text, (value) =>
      value.replace(/\(c\)/gi, "©").replace(/\(tm\)/gi, "™").replace(/\(r\)/gi, "®")
    );
    return applyTypographyRule(ruleAnalyticsCollector, "symbol_arrow", text, (value) => value.replace(/(?:->|=>)/g, "→"));
  } catch (error) {
    console.error("[Чистовик] Failed to normalize math and symbols", error);
    throw error;
  }
}

function isWordDateRangeDashCandidate(fullText: string, dashIndex: number): boolean {
  try {
    const month = "января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря";
    const before = fullText.slice(Math.max(0, dashIndex - 32), dashIndex);
    const after = fullText.slice(dashIndex + 1, dashIndex + 33);
    const beforePattern = new RegExp(`\\d{1,2}[ \\t\\u00A0]+(?:${month})[ \\t\\u00A0]*$`, "i");
    const afterPattern = new RegExp(`^[ \\t\\u00A0]*\\d{1,2}[ \\t\\u00A0]+(?:${month})(?=$|[^${LETTERS}])`, "i");

    return beforePattern.test(before) && afterPattern.test(after);
  } catch (error) {
    console.error("[Чистовик] Failed to check word date range dash candidate", error);
    throw error;
  }
}

function isMaskedSecretSign(fullText: string, signIndex: number): boolean {
  try {
    const before = fullText.slice(Math.max(0, signIndex - 24), signIndex);

    return /(?:^|[\s\u00A0:])\*{2,}[\* \t\u00A0]*$/.test(before);
  } catch (error) {
    console.error("[Чистовик] Failed to check masked secret sign", error);
    throw error;
  }
}

function normalizeMathExpressions(input: string, ruleAnalyticsCollector: TypographyRuleAnalyticsCollector | null = null): string {
  try {
    let result = "";
    let index = 0;

    while (index < input.length) {
      const expression = parseMathExpression(input, index, ruleAnalyticsCollector);

      if (expression === null) {
        const plainNumber = parseMathNumber(input, index, true);

        if (plainNumber !== null && hasMathNumberBoundaryBefore(input, index)) {
          result += input.slice(index, plainNumber.end);
          index = plainNumber.end;
          continue;
        }

        result += input[index];
        index += 1;
        continue;
      }

      result += expression.text;
      index = expression.end;
    }

    return result;
  } catch (error) {
    console.error("[Чистовик] Failed to normalize math expressions", error);
    throw error;
  }
}

function parseMathExpression(
  input: string,
  start: number,
  ruleAnalyticsCollector: TypographyRuleAnalyticsCollector | null = null
): MathExpressionParseResult | null {
  try {
    const firstNumber = parseMathNumber(input, start, true);

    if (firstNumber === null || !hasMathNumberBoundaryBefore(input, start) || isInsideProtectedToken(input, start, firstNumber.end)) {
      return null;
    }

    const parts = [firstNumber.text];
    const operators: MathOperatorParseResult[] = [];
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
        } else if (operator.text === MINUS) {
          recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "math_subtraction_context");
        } else {
          recordTypographyRuleDerivedChange(ruleAnalyticsCollector, "math_basic_operators");
        }
      }
    }

    return {
      end: cursor,
      text: normalizedText,
    };
  } catch (error) {
    console.error("[Чистовик] Failed to parse math expression", error);
    throw error;
  }
}

function parseMathNumber(input: string, start: number, allowSign: boolean): MathNumberParseResult | null {
  try {
    let cursor = start;
    let sign = "";

    if (allowSign && isMinusLike(input[cursor] ?? "")) {
      sign = MINUS;
      cursor += 1;

      while (/[ \t\u00A0]/.test(input[cursor] ?? "")) {
        cursor += 1;
      }
    }

    const numberStart = cursor;

    if (!/\d/.test(input[cursor] ?? "")) {
      return null;
    }

    cursor += 1;

    while (cursor < input.length) {
      const char = input[cursor];
      const next = input[cursor + 1] ?? "";

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
  } catch (error) {
    console.error("[Чистовик] Failed to parse math number", error);
    throw error;
  }
}

function parseMathOperator(input: string, start: number): MathOperatorParseResult | null {
  try {
    let cursor = start;

    while (/[ \t\u00A0]/.test(input[cursor] ?? "")) {
      cursor += 1;
    }

    const char = input[cursor] ?? "";

    if (!isMathOperatorChar(char)) {
      return null;
    }

    if (char === "-" && input[cursor + 1] === ">") {
      return null;
    }

    if (isMinusLike(char) && input[cursor - 1] === "%" && /\d/.test(input[cursor + 1] ?? "")) {
      return null;
    }

    cursor += 1;

    while (/[ \t\u00A0]/.test(input[cursor] ?? "")) {
      cursor += 1;
    }

    return {
      end: cursor,
      text: normalizeMathOperator(char),
    };
  } catch (error) {
    console.error("[Чистовик] Failed to parse math operator", error);
    throw error;
  }
}

function isMathOperatorChar(char: string): boolean {
  try {
    return char === "+" || char === "=" || char === "/" || char === "÷" || char === "*" || char === "×" || char === "x" || char === "X" || char === "х" || char === "Х" || isMinusLike(char);
  } catch (error) {
    console.error("[Чистовик] Failed to check math operator char", error);
    throw error;
  }
}

function normalizeMathOperator(char: string): string {
  try {
    if (char === "*" || char === "x" || char === "X" || char === "х" || char === "Х") {
      return "×";
    }

    if (isMinusLike(char)) {
      return MINUS;
    }

    return char;
  } catch (error) {
    console.error("[Чистовик] Failed to normalize math operator", error);
    throw error;
  }
}

function isMinusLike(char: string): boolean {
  try {
    return char === "-" || char === EN_DASH || char === EM_DASH || char === MINUS;
  } catch (error) {
    console.error("[Чистовик] Failed to check minus-like char", error);
    throw error;
  }
}

function hasMathExpressionContext(firstNumber: MathNumberParseResult, operators: MathOperatorParseResult[]): boolean {
  try {
    if (firstNumber.hasUnaryMinus || firstNumber.text.endsWith("%") || operators.length > 1) {
      return true;
    }

    return operators.some((operator) => operator.text !== MINUS);
  } catch (error) {
    console.error("[Чистовик] Failed to check math expression context", error);
    throw error;
  }
}

function hasMathNumberBoundaryBefore(input: string, start: number): boolean {
  try {
    const previous = input[start - 1] ?? "";

    return !/[A-Za-zА-Яа-яЁё\d.,]/.test(previous);
  } catch (error) {
    console.error("[Чистовик] Failed to check math number boundary before", error);
    throw error;
  }
}

function hasMathNumberBoundaryAfter(input: string, end: number): boolean {
  try {
    const next = input[end] ?? "";

    if (next === "." && !/\d/.test(input[end + 1] ?? "")) {
      return true;
    }

    if (next === "," && !/\d/.test(input[end + 1] ?? "")) {
      return true;
    }

    return !/[A-Za-zА-Яа-яЁё\d.,]/.test(next);
  } catch (error) {
    console.error("[Чистовик] Failed to check math number boundary after", error);
    throw error;
  }
}

function isInsideProtectedToken(input: string, start: number, end: number): boolean {
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
  } catch (error) {
    console.error("[Чистовик] Failed to check protected token", error);
    throw error;
  }
}

function isMaskedSecretToken(token: string): boolean {
  try {
    return /\*{2,}/.test(token) && /\d/.test(token);
  } catch (error) {
    console.error("[Чистовик] Failed to check masked secret token", error);
    throw error;
  }
}

function hasProtectedTokenLetters(token: string): boolean {
  try {
    for (const char of token) {
      if (isLetter(char) && char !== "x" && char !== "X" && char !== "х" && char !== "Х") {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("[Чистовик] Failed to check protected token letters", error);
    throw error;
  }
}

function isInsidePhoneNumberCandidate(input: string, start: number, end: number): boolean {
  try {
    const bounds = getPhoneLikeTokenBounds(input, start, end);
    const token = input.slice(bounds.start, bounds.end);

    return isRussianFullPhoneToken(token) || isRussianPhoneTailToken(token);
  } catch (error) {
    console.error("[Чистовик] Failed to check phone number candidate", error);
    throw error;
  }
}

function isInsideRussianPhoneTail(input: string, start: number, end: number): boolean {
  try {
    const bounds = getPhoneLikeTokenBounds(input, start, end);
    const token = input.slice(bounds.start, bounds.end);

    return isRussianPhoneTailToken(token);
  } catch (error) {
    console.error("[Чистовик] Failed to check Russian phone tail", error);
    throw error;
  }
}

function isRussianFullPhoneToken(token: string): boolean {
  try {
    const digits = token.replace(/\D/g, "");

    return digits.length === 11 && (digits[0] === "7" || digits[0] === "8");
  } catch (error) {
    console.error("[Чистовик] Failed to check Russian full phone token", error);
    throw error;
  }
}

function isRussianPhoneTailToken(token: string): boolean {
  try {
    const normalized = normalizeHorizontalSpaces(token);
    const digits = normalized.replace(/\D/g, "");

    return digits.length === 10 && digits[0] === "9" && /^[ ]*9\d{2}[ .\-–—‑]*\d{3}[ .\-–—‑]*\d{2}[ .\-–—‑]*\d{2}[ ]*$/.test(normalized);
  } catch (error) {
    console.error("[Чистовик] Failed to check Russian phone tail token", error);
    throw error;
  }
}

function isStandaloneRussianPhoneCountryPrefix(input: string): boolean {
  try {
    return /^[ \t\u00A0]*\+[ \t\u00A0]*7[ \t\u00A0]*$/.test(input);
  } catch (error) {
    console.error("[Чистовик] Failed to check standalone phone country prefix", error);
    throw error;
  }
}

function normalizeStandaloneRussianPhoneCountryPrefix(input: string): string {
  try {
    return input.replace(/^[ \t\u00A0]*\+[ \t\u00A0]*7[ \t\u00A0]*$/, "+7");
  } catch (error) {
    console.error("[Чистовик] Failed to normalize standalone phone country prefix", error);
    throw error;
  }
}

function getPhoneLikeTokenBounds(input: string, start: number, end: number): { start: number; end: number } {
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
  } catch (error) {
    console.error("[Чистовик] Failed to get phone-like token bounds", error);
    throw error;
  }
}

function getLooseTokenBounds(input: string, start: number, end: number): { start: number; end: number } {
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
  } catch (error) {
    console.error("[Чистовик] Failed to get loose token bounds", error);
    throw error;
  }
}

function previousVisibleChar(input: string, index: number): string | null {
  try {
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      if (!/[ \t\u00A0]/.test(input[cursor])) {
        return input[cursor];
      }
    }

    return null;
  } catch (error) {
    console.error("[Чистовик] Failed to find previous visible char", error);
    throw error;
  }
}

function nextVisibleChar(input: string, index: number): string | null {
  try {
    for (let cursor = index + 1; cursor < input.length; cursor += 1) {
      if (!/[ \t\u00A0]/.test(input[cursor])) {
        return input[cursor];
      }
    }

    return null;
  } catch (error) {
    console.error("[Чистовик] Failed to find next visible char", error);
    throw error;
  }
}

function previousNonSpace(input: string, index: number): string | null {
  try {
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      if (!/[ \t\u00A0]/.test(input[cursor])) {
        return input[cursor];
      }
    }

    return null;
  } catch (error) {
    console.error("[Чистовик] Failed to find previous non-space char", error);
    throw error;
  }
}

function nextNonSpace(input: string, index: number): string | null {
  try {
    for (let cursor = index; cursor < input.length; cursor += 1) {
      if (!/[ \t\u00A0]/.test(input[cursor])) {
        return input[cursor];
      }
    }

    return null;
  } catch (error) {
    console.error("[Чистовик] Failed to find next non-space char", error);
    throw error;
  }
}

function countMatches(input: string, regex: RegExp): number {
  try {
    return input.match(regex)?.length ?? 0;
  } catch (error) {
    console.error("[Чистовик] Failed to count regex matches", error);
    throw error;
  }
}

function isLetter(char: string): boolean {
  try {
    return /^[A-Za-zА-Яа-яЁё]$/.test(char);
  } catch (error) {
    console.error("[Чистовик] Failed to check letter", error);
    throw error;
  }
}

function isCyrillicLetter(char: string): boolean {
  try {
    return /^[А-Яа-яЁё]$/.test(char);
  } catch (error) {
    console.error("[Чистовик] Failed to check Cyrillic letter", error);
    throw error;
  }
}

function isDash(char: string): boolean {
  try {
    return char === "-" || char === EN_DASH || char === EM_DASH || char === MINUS;
  } catch (error) {
    console.error("[Чистовик] Failed to check dash", error);
    throw error;
  }
}

void run();
