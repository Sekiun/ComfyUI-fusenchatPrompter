import { app } from "../../../scripts/app.js";
import { readFusenchatText } from "./png_metadata.mjs";

const EXTENSION_NAME = "fusenchat.prompt-chips";
const NODE_NAME = "FusenchatPromptChips";
const PROMPT_SEPARATOR = " ";
const EMPTY_CHIP_DATA = '{"version":1,"singleSelect":false,"chips":[]}';

function buildPrompt(items) {
    return items
        .filter((item) => !item.disabled)
        .map((item) => item.text.replace(/[\r\n]+/g, " ").trim())
        .filter(Boolean)
        .join(PROMPT_SEPARATOR);
}

function installStyles() {
    if (document.getElementById("fusenchat-prompt-chips-styles")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "fusenchat-prompt-chips-styles";
    style.textContent = `
        .fusenchat-chips {
            --fc-accent: #e7a83e;
            --fc-border: color-mix(in srgb, var(--border-color, #777) 72%, transparent);
            --fc-panel: color-mix(in srgb, var(--comfy-menu-bg, #202020) 90%, #fff 10%);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 100%;
            height: 100%;
            padding: 10px;
            color: var(--input-text, #ddd);
            font: 12px/1.45 ui-sans-serif, system-ui, sans-serif;
            overflow: hidden;
        }
        .fusenchat-chips * { box-sizing: border-box; }
        .fusenchat-options {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            gap: 8px;
            min-height: 24px;
        }
        .fusenchat-single-select {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            cursor: pointer;
            user-select: none;
        }
        .fusenchat-single-select input {
            position: absolute;
            opacity: 0;
            pointer-events: none;
        }
        .fusenchat-switch {
            position: relative;
            width: 30px;
            height: 17px;
            border: 1px solid var(--fc-border);
            border-radius: 999px;
            background: var(--fc-panel);
            transition: background 120ms ease, border-color 120ms ease;
        }
        .fusenchat-switch::after {
            content: "";
            position: absolute;
            top: 2px;
            left: 2px;
            width: 11px;
            height: 11px;
            border-radius: 50%;
            background: color-mix(in srgb, currentColor 70%, transparent);
            transition: transform 120ms ease, background 120ms ease;
        }
        .fusenchat-single-select input:checked + .fusenchat-switch {
            border-color: var(--fc-accent);
            background: color-mix(in srgb, var(--fc-accent) 25%, var(--fc-panel));
        }
        .fusenchat-single-select input:checked + .fusenchat-switch::after {
            transform: translateX(13px);
            background: var(--fc-accent);
        }
        .fusenchat-list {
            flex: 1 1 auto;
            min-height: 160px;
            display: flex;
            align-content: flex-start;
            gap: 9px;
            flex-wrap: wrap;
            align-items: flex-start;
            overflow: auto;
            padding: 2px;
        }
        .fusenchat-empty {
            width: 100%;
            align-self: center;
            color: color-mix(in srgb, currentColor 55%, transparent);
            text-align: center;
        }
        .fusenchat-chip {
            position: relative;
            flex: 0 1 auto;
            width: fit-content;
            max-width: 100%;
            min-height: 34px;
            padding: 8px 78px 8px 10px;
            border: 1px solid var(--fc-border);
            border-radius: 7px;
            background: var(--fc-panel);
            cursor: grab;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            user-select: text;
            touch-action: none;
        }
        .fusenchat-chip.is-disabled {
            border-color: #9b72e8;
            background: color-mix(in srgb, #7c3fc6 42%, var(--fc-panel));
            color: color-mix(in srgb, currentColor 78%, #cdb8ff);
        }
        .fusenchat-chip:active { cursor: grabbing; }
        .fusenchat-chip.is-dragging {
            position: fixed;
            left: -10000px;
            top: -10000px;
            opacity: 0;
        }
        .fusenchat-chip.is-drop-before {
            border-color: var(--fc-accent);
            box-shadow: -3px 0 0 var(--fc-accent);
        }
        .fusenchat-chip.is-drop-after {
            border-color: var(--fc-accent);
            box-shadow: 3px 0 0 var(--fc-accent);
        }
        .fusenchat-drag-ghost {
            position: fixed;
            z-index: 100000;
            box-sizing: border-box;
            margin: 0;
            opacity: .68;
            pointer-events: none;
            cursor: grabbing;
            box-shadow: 0 8px 24px rgba(0, 0, 0, .35);
        }
        .fusenchat-drag-ghost .fusenchat-chip-actions {
            display: none;
        }
        .fusenchat-placeholder {
            flex: 0 0 auto;
            min-height: 34px;
            border: 1px dashed var(--fc-accent);
            border-radius: 7px;
            background: color-mix(in srgb, var(--fc-accent) 10%, transparent);
        }
        .fusenchat-chip-actions {
            position: absolute;
            top: 6px;
            right: 6px;
            display: flex;
            gap: 2px;
        }
        .fusenchat-toggle,
        .fusenchat-copy,
        .fusenchat-remove {
            width: 20px;
            height: 20px;
            padding: 0;
            border: 0;
            border-radius: 999px;
            background: transparent;
            color: inherit;
            opacity: .65;
            cursor: pointer;
            font: 700 14px/18px ui-sans-serif, system-ui, sans-serif;
        }
        .fusenchat-toggle:hover,
        .fusenchat-toggle.is-disabled {
            background: color-mix(in srgb, #9b72e8 45%, transparent);
            color: #decfff;
            opacity: 1;
        }
        .fusenchat-copy:hover {
            background: color-mix(in srgb, var(--fc-accent) 35%, transparent);
            opacity: 1;
        }
        .fusenchat-copy.is-copied {
            color: #75d38b;
            opacity: 1;
        }
        .fusenchat-remove:hover {
            background: #b54135;
            color: #fff;
            opacity: 1;
        }
        .fusenchat-add {
            flex: 0 0 auto;
            width: 34px;
            height: 34px;
            padding: 0;
            border: 1px dashed var(--fc-border);
            border-radius: 7px;
            background: transparent;
            color: inherit;
            cursor: pointer;
            font: 400 20px/30px ui-sans-serif, system-ui, sans-serif;
            opacity: .7;
        }
        .fusenchat-add:hover {
            border-color: var(--fc-accent);
            color: var(--fc-accent);
            opacity: 1;
        }
        .fusenchat-add-editor {
            flex: 1 1 220px;
            min-width: 150px;
            max-width: 100%;
        }
        .fusenchat-add-input {
            width: 100%;
            height: 34px;
            padding: 7px 9px;
            border: 1px solid var(--fc-accent);
            border-radius: 7px;
            outline: none;
            background: var(--fc-panel);
            color: inherit;
            font: inherit;
        }
        .fusenchat-status {
            flex: 0 0 auto;
            min-height: 17px;
            color: color-mix(in srgb, currentColor 65%, transparent);
        }
        .fusenchat-status.is-error { color: #ff8175; }
    `;
    document.head.appendChild(style);
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) {
        element.textContent = text;
    }
    return element;
}

async function copyTextToClipboard(text) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) {
        throw new Error("clipboard copy failed");
    }
}

function hideSerializedWidget(widget) {
    widget.hidden = true;
    widget.computeSize = () => [0, -4];

    if (widget.inputEl) {
        widget.inputEl.style.display = "none";
        widget.inputEl.closest?.(".comfy-widget")?.style.setProperty("display", "none");
    }
}

function parseChipData(value) {
    if (!value) {
        return {
            chips: [],
            singleSelect: false,
        };
    }

    try {
        const parsed = JSON.parse(value);
        if (parsed?.version !== 1 || !Array.isArray(parsed.chips)) {
            return {
                chips: [],
                singleSelect: false,
            };
        }
        const chips = parsed.chips
            .map((chip) => ({
                text: typeof chip?.text === "string" ? chip.text : "",
                disabled: chip?.disabled === true,
            }))
            .filter((chip) => chip.text.length > 0);
        return {
            chips,
            singleSelect: parsed.singleSelect === true,
        };
    } catch {
        return {
            chips: [],
            singleSelect: false,
        };
    }
}

function serializeChipData(items, singleSelect) {
    return JSON.stringify({
        version: 1,
        singleSelect: singleSelect === true,
        chips: items.map((item) => ({
            text: item.text,
            disabled: item.disabled === true,
        })),
    });
}

function createUi(node, promptWidget, chipDataWidget) {
    const state = {
        items: [],
        pointerDrag: null,
        nextId: 1,
        singleSelect: false,
    };

    const root = createElement("div", "fusenchat-chips");
    const options = createElement("div", "fusenchat-options");
    const singleSelectLabel = createElement("label", "fusenchat-single-select");
    const singleSelectInput = document.createElement("input");
    singleSelectInput.type = "checkbox";
    const singleSelectSwitch = createElement("span", "fusenchat-switch");
    const singleSelectText = createElement("span", "", "単一選択モード");
    singleSelectLabel.append(singleSelectInput, singleSelectSwitch, singleSelectText);
    options.append(singleSelectLabel);
    const list = createElement("div", "fusenchat-list");
    const status = createElement("div", "fusenchat-status");

    root.append(options, list, status);

    function setStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle("is-error", isError);
    }

    function notifyWidget(widget) {
        widget.callback?.(widget.value, app.canvas, node, widget);
    }

    function syncWidgets() {
        promptWidget.value = buildPrompt(state.items);
        chipDataWidget.value = serializeChipData(state.items, state.singleSelect);
        notifyWidget(promptWidget);
        notifyWidget(chipDataWidget);
        const enabledCount = state.items.filter((item) => !item.disabled).length;
        setStatus(
            `${enabledCount}/${state.items.length}個のチップを使用 / ${promptWidget.value.length}文字`,
        );
        node.graph?.setDirtyCanvas?.(true, true);
        node.graph?.change?.();
    }

    function enforceSingleSelection(preferredId = null) {
        if (!state.singleSelect || state.items.length === 0) {
            return;
        }

        let selected = state.items.find((item) => item.id === preferredId);
        if (!selected) {
            selected = state.items.find((item) => !item.disabled) ?? state.items[0];
        }
        for (const item of state.items) {
            item.disabled = item.id !== selected.id;
        }
    }

    function restoreFromWorkflow() {
        const restored = parseChipData(chipDataWidget.value);
        state.singleSelect = restored.singleSelect;
        singleSelectInput.checked = state.singleSelect;
        state.items = restored.chips.map((chip) => ({
            id: state.nextId++,
            text: chip.text,
            disabled: chip.disabled,
        }));
        enforceSingleSelection();
        chipDataWidget.value = serializeChipData(state.items, state.singleSelect);
        renderItems();

        if (state.items.length > 0) {
            const restoredPrompt = buildPrompt(state.items);
            if (promptWidget.value !== restoredPrompt) {
                promptWidget.value = restoredPrompt;
            }
            setStatus(`${state.items.length}個のチップをworkflowから復元`);
        } else if (promptWidget.value) {
            setStatus("保存済みpromptがあります。PNG追加時にチップ情報へ置き換わります");
        } else {
            setStatus("チップのテキストと順序はworkflowに保存されます");
        }
    }

    function removeItem(id) {
        const index = state.items.findIndex((item) => item.id === id);
        if (index < 0) {
            return;
        }
        const wasEnabled = !state.items[index].disabled;
        state.items.splice(index, 1);
        if (state.singleSelect && wasEnabled) {
            enforceSingleSelection();
        }
        renderItems();
        syncWidgets();
    }

    function toggleItem(id) {
        const item = state.items.find((entry) => entry.id === id);
        if (!item) {
            return;
        }
        if (state.singleSelect) {
            enforceSingleSelection(item.id);
        } else {
            item.disabled = !item.disabled;
        }
        renderItems();
        syncWidgets();
    }

    function setSingleSelect(enabled) {
        state.singleSelect = enabled;
        if (enabled) {
            enforceSingleSelection();
        }
        renderItems();
        syncWidgets();
    }

    function addTextItem(text) {
        const normalizedText = text.trim();
        if (!normalizedText) {
            return false;
        }

        const item = {
            id: state.nextId++,
            text: normalizedText,
            disabled: false,
        };
        state.items.push(item);
        if (state.singleSelect) {
            enforceSingleSelection(item.id);
        }
        renderItems();
        syncWidgets();
        return true;
    }

    function moveItem(sourceId, targetId, afterTarget) {
        const sourceIndex = state.items.findIndex((item) => item.id === sourceId);
        const targetIndex = state.items.findIndex((item) => item.id === targetId);
        if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
            return;
        }

        const [item] = state.items.splice(sourceIndex, 1);
        let insertionIndex = state.items.findIndex((entry) => entry.id === targetId);
        if (afterTarget) {
            insertionIndex += 1;
        }
        state.items.splice(insertionIndex, 0, item);
        renderItems();
        syncWidgets();
    }

    function clearDropIndicators() {
        for (const chip of list.querySelectorAll(".fusenchat-chip")) {
            chip.classList.remove("is-drop-before", "is-drop-after");
        }
    }

    function findDropTarget(clientX, clientY, sourceId) {
        let nearest = null;
        let nearestDistance = Number.POSITIVE_INFINITY;

        for (const chip of list.querySelectorAll(".fusenchat-chip")) {
            const id = Number(chip.dataset.id);
            if (id === sourceId) {
                continue;
            }

            const rect = chip.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.hypot(clientX - centerX, clientY - centerY);
            if (distance < nearestDistance) {
                const sameRow = Math.abs(clientY - centerY) < rect.height / 2;
                nearest = {
                    chip,
                    id,
                    after: sameRow ? clientX > centerX : clientY > centerY,
                };
                nearestDistance = distance;
            }
        }

        return nearest;
    }

    function positionDragGhost(drag, clientX, clientY) {
        drag.ghost.style.left = `${clientX - drag.offsetX}px`;
        drag.ghost.style.top = `${clientY - drag.offsetY}px`;
    }

    function activatePointerDrag(drag, event) {
        const rect = drag.sourceChip.getBoundingClientRect();
        const sourceStyle = getComputedStyle(drag.sourceChip);
        const layoutWidth = drag.sourceChip.offsetWidth || rect.width;
        const layoutHeight = drag.sourceChip.offsetHeight || rect.height;
        const scaleX = rect.width / layoutWidth;
        const scaleY = rect.height / layoutHeight;
        const ghost = drag.sourceChip.cloneNode(true);
        ghost.classList.add("fusenchat-drag-ghost");
        ghost.removeAttribute("data-id");
        ghost.style.width = `${layoutWidth}px`;
        ghost.style.height = `${layoutHeight}px`;
        ghost.style.maxWidth = "none";
        ghost.style.transform = `scale(${scaleX}, ${scaleY})`;
        ghost.style.transformOrigin = "top left";
        ghost.style.background = sourceStyle.background;
        ghost.style.border = sourceStyle.border;
        ghost.style.borderRadius = sourceStyle.borderRadius;
        ghost.style.color = sourceStyle.color;
        ghost.style.font = sourceStyle.font;

        const placeholder = createElement("div", "fusenchat-placeholder");
        placeholder.style.width = `${layoutWidth}px`;
        placeholder.style.height = `${layoutHeight}px`;
        placeholder.style.flexBasis = `${layoutWidth}px`;

        drag.offsetX = event.clientX - rect.left;
        drag.offsetY = event.clientY - rect.top;
        drag.ghost = ghost;
        drag.placeholder = placeholder;
        drag.sourceChip.before(placeholder);
        drag.sourceChip.classList.add("is-dragging");
        document.body.appendChild(ghost);
        positionDragGhost(drag, event.clientX, event.clientY);
    }

    function movePlaceholder(drag, target) {
        if (!target) {
            return;
        }

        if (target.after) {
            target.chip.after(drag.placeholder);
        } else {
            target.chip.before(drag.placeholder);
        }
    }

    function cleanupPointerDrag(drag) {
        drag.sourceChip.classList.remove("is-dragging");
        drag.ghost?.remove();
        drag.placeholder?.remove();
        clearDropIndicators();
    }

    function beginPointerDrag(event, chip, itemId) {
        if (event.button !== 0 || event.target.closest("button")) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        chip.setPointerCapture(event.pointerId);
        state.pointerDrag = {
            pointerId: event.pointerId,
            sourceId: itemId,
            sourceChip: chip,
            startX: event.clientX,
            startY: event.clientY,
            active: false,
            targetId: null,
            after: false,
            ghost: null,
            placeholder: null,
            offsetX: 0,
            offsetY: 0,
        };
    }

    function updatePointerDrag(event) {
        const drag = state.pointerDrag;
        if (!drag || drag.pointerId !== event.pointerId) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        if (!drag.active) {
            const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
            if (distance < 5) {
                return;
            }
            drag.active = true;
            activatePointerDrag(drag, event);
        }

        clearDropIndicators();
        positionDragGhost(drag, event.clientX, event.clientY);
        const target = findDropTarget(event.clientX, event.clientY, drag.sourceId);
        drag.targetId = target?.id ?? null;
        drag.after = target?.after ?? false;
        if (target) {
            movePlaceholder(drag, target);
            target.chip.classList.add(target.after ? "is-drop-after" : "is-drop-before");
        }
    }

    function finishPointerDrag(event) {
        const drag = state.pointerDrag;
        if (!drag || drag.pointerId !== event.pointerId) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        if (drag.sourceChip.hasPointerCapture(event.pointerId)) {
            drag.sourceChip.releasePointerCapture(event.pointerId);
        }
        state.pointerDrag = null;
        cleanupPointerDrag(drag);

        if (drag.active && drag.targetId !== null) {
            moveItem(drag.sourceId, drag.targetId, drag.after);
        }
    }

    function renderItems() {
        list.replaceChildren();
        if (state.items.length === 0) {
            list.append(
                createElement(
                    "div",
                    "fusenchat-empty",
                    "fusenchat PNGをノードへドロップ",
                ),
            );
        }

        state.items.forEach((item) => {
            const chip = createElement("div", "fusenchat-chip");
            chip.dataset.id = String(item.id);
            chip.classList.toggle("is-disabled", item.disabled === true);

            const text = createElement("span", "fusenchat-chip-text", item.text);
            const actions = createElement("span", "fusenchat-chip-actions");
            const toggle = createElement("button", "fusenchat-toggle", "●");
            toggle.type = "button";
            toggle.title = state.singleSelect
                ? item.disabled
                    ? "このチップを選択"
                    : "選択中"
                : item.disabled
                  ? "有効化"
                  : "無効化";
            toggle.setAttribute(
                "aria-label",
                state.singleSelect
                    ? item.disabled
                        ? "このプロンプトを選択"
                        : "選択中のプロンプト"
                    : item.disabled
                      ? "プロンプトを有効化"
                      : "プロンプトを無効化",
            );
            toggle.classList.toggle("is-disabled", item.disabled === true);
            toggle.addEventListener("click", (event) => {
                event.stopPropagation();
                toggleItem(item.id);
            });
            const copy = createElement("button", "fusenchat-copy", "⧉");
            copy.type = "button";
            copy.title = "コピー";
            copy.setAttribute("aria-label", "プロンプトをコピー");
            copy.addEventListener("click", async (event) => {
                event.stopPropagation();
                try {
                    await copyTextToClipboard(item.text);
                    copy.textContent = "✓";
                    copy.classList.add("is-copied");
                    setStatus("チップの内容をコピーしました");
                    window.setTimeout(() => {
                        copy.textContent = "⧉";
                        copy.classList.remove("is-copied");
                    }, 1000);
                } catch {
                    setStatus("クリップボードへコピーできませんでした", true);
                }
            });
            const remove = createElement("button", "fusenchat-remove", "×");
            remove.type = "button";
            remove.title = "削除";
            remove.addEventListener("click", (event) => {
                event.stopPropagation();
                removeItem(item.id);
            });
            actions.append(toggle, copy, remove);

            chip.addEventListener("pointerdown", (event) => beginPointerDrag(event, chip, item.id));
            chip.addEventListener("pointermove", updatePointerDrag);
            chip.addEventListener("pointerup", finishPointerDrag);
            chip.addEventListener("pointercancel", finishPointerDrag);

            chip.append(text, actions);
            list.append(chip);
        });

        const addButton = createElement("button", "fusenchat-add", "+");
        addButton.type = "button";
        addButton.title = "テキストタグを追加";
        addButton.setAttribute("aria-label", "テキストタグを追加");
        addButton.addEventListener("pointerdown", (event) => event.stopPropagation());
        addButton.addEventListener("click", (event) => {
            event.stopPropagation();

            const editor = createElement("div", "fusenchat-add-editor");
            const input = document.createElement("input");
            input.type = "text";
            input.className = "fusenchat-add-input";
            input.placeholder = "タグのテキストを入力";
            input.setAttribute("aria-label", "追加するタグのテキスト");
            input.addEventListener("pointerdown", (pointerEvent) => {
                pointerEvent.stopPropagation();
            });
            input.addEventListener("keydown", (keyEvent) => {
                keyEvent.stopPropagation();
                if (keyEvent.key === "Enter" && !keyEvent.isComposing) {
                    keyEvent.preventDefault();
                    if (!addTextItem(input.value)) {
                        renderItems();
                    }
                } else if (keyEvent.key === "Escape") {
                    keyEvent.preventDefault();
                    renderItems();
                }
            });
            input.addEventListener("blur", () => {
                if (editor.isConnected) {
                    renderItems();
                }
            });
            editor.append(input);
            addButton.replaceWith(editor);
            input.focus();
        });
        list.append(addButton);
    }

    async function addFiles(files) {
        const pngFiles = [...files].filter(
            (file) => file.type === "image/png" || file.name.toLowerCase().endsWith(".png"),
        );
        if (pngFiles.length === 0) {
            setStatus("PNGファイルを選択してください", true);
            return false;
        }

        let added = 0;
        const errors = [];
        const previouslyEnabledId = state.items.find((item) => !item.disabled)?.id ?? null;
        for (const file of pngFiles) {
            try {
                const text = await readFusenchatText(file);
                state.items.push({
                    id: state.nextId++,
                    text,
                    disabled: false,
                });
                added += 1;
            } catch (error) {
                errors.push(`${file.name}: ${error.message}`);
            }
        }

        if (added > 0) {
            if (state.singleSelect) {
                enforceSingleSelection(previouslyEnabledId);
            }
            renderItems();
            syncWidgets();
        }
        if (errors.length > 0) {
            setStatus(errors.join(" / "), true);
        }
        return added > 0;
    }

    function preventFileDropDefaults(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    for (const eventName of ["dragenter", "dragover", "dragleave", "drop"]) {
        root.addEventListener(eventName, (event) => {
            if (event.dataTransfer?.types?.includes("Files")) {
                preventFileDropDefaults(event);
            }
        });
    }
    root.addEventListener("drop", async (event) => {
        if (event.dataTransfer?.files?.length) {
            await addFiles(event.dataTransfer.files);
        }
    });
    singleSelectInput.addEventListener("change", () => {
        setSingleSelect(singleSelectInput.checked);
    });

    restoreFromWorkflow();

    return {
        root,
        addFiles,
        restoreFromWorkflow,
        destroy() {
            if (state.pointerDrag) {
                cleanupPointerDrag(state.pointerDrag);
                state.pointerDrag = null;
            }
        },
    };
}

app.registerExtension({
    name: EXTENSION_NAME,
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData?.name !== NODE_NAME) {
            return;
        }

        const originalOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            originalOnNodeCreated?.apply(this, arguments);
            installStyles();

            const promptWidget = this.widgets?.find((widget) => widget.name === "prompt");
            const chipDataWidget = this.widgets?.find((widget) => widget.name === "chip_data");
            if (!promptWidget || !chipDataWidget) {
                console.error(`[${EXTENSION_NAME}] required widgets were not found`);
                return;
            }

            hideSerializedWidget(promptWidget);
            hideSerializedWidget(chipDataWidget);
            if (!chipDataWidget.value) {
                chipDataWidget.value = EMPTY_CHIP_DATA;
            }

            const ui = createUi(this, promptWidget, chipDataWidget);
            const domWidget = this.addDOMWidget("fusenchat_chips", "dom", ui.root, {
                serialize: false,
                hideOnZoom: false,
                getMinHeight: () => 150,
            });
            domWidget.serialize = false;
            if (typeof domWidget.computeLayoutSize !== "function") {
                domWidget.computeSize = (width) => [
                    width,
                    Math.max(150, this.size[1] - 60),
                ];
            }

            this.__fusenchatPromptChips = ui;
            this.pasteFile = (file) => {
                if (file.type === "image/png" || file.name.toLowerCase().endsWith(".png")) {
                    void ui.addFiles([file]);
                    return true;
                }
                return false;
            };
            this.onDragOver = (event) =>
                [...(event.dataTransfer?.items ?? [])].some(
                    (item) =>
                        item.kind === "file" &&
                        (item.type === "image/png" || item.type === "application/octet-stream"),
                );
            this.onDragDrop = (event) => {
                const files = [...(event.dataTransfer?.files ?? [])];
                if (files.length === 0) {
                    return false;
                }
                void ui.addFiles(files);
                return true;
            };

            this.setSize([520, 300]);
        };

        const originalOnConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function () {
            originalOnConfigure?.apply(this, arguments);
            this.__fusenchatPromptChips?.restoreFromWorkflow();
        };

        const originalOnRemoved = nodeType.prototype.onRemoved;
        nodeType.prototype.onRemoved = function () {
            this.__fusenchatPromptChips?.destroy();
            this.__fusenchatPromptChips = null;
            originalOnRemoved?.apply(this, arguments);
        };
    },
});
