class Tag:
    def __init__(self, tag_id: str, display_name: str):
        self.tag_id = tag_id
        self.display_name = display_name

class TagRepository:
    def get_all_hobbies(self) -> list[str]:
        raise NotImplementedError # nó đang pdfohfhirhi

    def get_duration_tags(self) -> list[Tag]:
        raise NotImplementedError