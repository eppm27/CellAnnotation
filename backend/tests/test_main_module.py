import asyncio
import importlib
import logging.config
import os
import sys
import types
from pathlib import Path


def test_main_warns_when_logging_config_missing(monkeypatch, caplog):
    sys.modules.pop("app.main", None)
    stub_yaml = types.SimpleNamespace(safe_load=lambda data: {})
    monkeypatch.setitem(sys.modules, "yaml", stub_yaml)

    original_exists = Path.exists

    def fake_exists(self):
        if str(self).endswith("backend/app/logging.yaml"):
            return False
        return original_exists(self)

    monkeypatch.setattr(Path, "exists", fake_exists)
    caplog.set_level("WARNING")

    mod = importlib.import_module("app.main")

    assert "using basic configuration" in caplog.text
    assert mod.app is not None


def test_main_uses_yaml_logging_configuration(monkeypatch):
    sys.modules.pop("app.main", None)

    class FakeYaml:
        def __init__(self):
            self.calls = []

        def safe_load(self, text):
            self.calls.append(text)
            return {
                "version": 1,
                "handlers": {"console": {"class": "logging.StreamHandler"}},
                "root": {"handlers": ["console"], "level": "INFO"},
            }

    fake_yaml = FakeYaml()
    monkeypatch.setitem(sys.modules, "yaml", fake_yaml)

    captured = {}

    def fake_dict_config(config):
        captured["config"] = config

    monkeypatch.setattr(logging.config, "dictConfig", fake_dict_config)

    importlib.import_module("app.main")

    assert "config" in captured
    assert captured["config"]["version"] == 1
    assert fake_yaml.calls  # ensure file content was read


def test_main_creates_assets_directory_when_missing(monkeypatch):
    sys.modules.pop("app.main", None)
    stub_yaml = types.SimpleNamespace(
        safe_load=lambda data: {
            "version": 1,
            "handlers": {"console": {"class": "logging.StreamHandler"}},
            "root": {"handlers": ["console"], "level": "INFO"},
        }
    )
    monkeypatch.setitem(sys.modules, "yaml", stub_yaml)

    original_exists = Path.exists

    def fake_exists(self):
        if str(self).endswith("frontend/assets"):
            return False
        return original_exists(self)

    monkeypatch.setattr(Path, "exists", fake_exists)

    created = []

    def fake_makedirs(path, *args, **kwargs):
        created.append(Path(path))

    monkeypatch.setattr(os, "makedirs", fake_makedirs)

    importlib.import_module("app.main")

    assert created, "assets directory should be created"
    assert any(str(p).endswith("frontend/assets") for p in created)


def test_main_serves_static_assets(monkeypatch, tmp_path):
    from app import main as main_module

    index = tmp_path / "index.html"
    index.write_text("<html></html>")
    favicon = tmp_path / "favicon.ico"
    favicon.write_bytes(b"ico")

    monkeypatch.setattr(main_module, "FRONTEND_BUILD", tmp_path)

    resp = asyncio.run(main_module.serve_spa())
    assert resp.path == index

    fav_resp = asyncio.run(main_module.favicon())
    assert fav_resp.path == favicon


def test_main_static_fallback(monkeypatch, tmp_path):
    from app import main as main_module

    monkeypatch.setattr(main_module, "FRONTEND_BUILD", tmp_path)

    resp = asyncio.run(main_module.serve_spa())
    assert resp.status_code == 503
    assert b"Frontend build not found" in resp.body

    icon_resp = asyncio.run(main_module.favicon())
    assert icon_resp.status_code == 404
    assert b"favicon not found" in icon_resp.body
