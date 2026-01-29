import re

from app.utils.azure_sas import build_profile_picture_blob_name


def test_build_profile_picture_blob_name_sanitizes_filename():
    blob_name = build_profile_picture_blob_name(42, "../weird file@name.png")
    assert blob_name.startswith("profile-pictures/42/")
    assert ".." not in blob_name
    assert re.search(r"weird_file_name\.png$", blob_name)
