from typing import Any
from sqlalchemy import JSON
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    type_annotation_map = {
        dict[str, Any]: JSON,
        list[dict[str, Any]]: JSON,
        list[str]: JSON,
    }

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

    def update_vars(self, update_dict):
        for key, value in update_dict.items():
            setattr(self, key, value)
