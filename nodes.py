class FusenchatPromptChips:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "prompt": (
                    "STRING",
                    {
                        "default": "",
                        "multiline": True,
                        "dynamicPrompts": False,
                    },
                ),
                "chip_data": (
                    "STRING",
                    {
                        "default": '{"version":1,"singleSelect":false,"chips":[]}',
                        "multiline": False,
                        "dynamicPrompts": False,
                    },
                ),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("prompt",)
    FUNCTION = "get_prompt"
    CATEGORY = "prompt/fusenchat"
    DESCRIPTION = (
        "Builds a prompt from fusenchat PNG metadata. "
        "The frontend stores the generated prompt and restorable text chips."
    )

    def get_prompt(self, prompt, chip_data):
        return (prompt,)


NODE_CLASS_MAPPINGS = {
    "FusenchatPromptChips": FusenchatPromptChips,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FusenchatPromptChips": "Fusenchat Prompt Chips",
}
