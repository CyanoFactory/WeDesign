"""
Copyright (c) 2019 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
"""

from io import BytesIO, TextIOWrapper

from . import sbml_parser
from .optgene import OptGeneParser


def decompress_gzip(stream) -> BytesIO:
    if stream.read(1) == b'\x1f' and stream.read(1) == b'\x8b':
        # gzip compressed
        stream.seek(0)
        import gzip
        data = gzip.decompress(stream.getvalue())
        stream = BytesIO()
        stream.write(data)

    stream.seek(0)
    return stream


def detect_format(stream) -> str:
    """
    Detects the file format inside a stream
    :exception UnicodeDecodeError When stream content is not valid utf-8
    """
    # utf-8-sig: Skip BOM
    ss = TextIOWrapper(stream, encoding='utf-8-sig')

    if ss.readline().startswith("<?xml"):
        ss.detach()
        return "sbml"
    else:
        ss.detach()
        return "opt"


def from_stream(stream):
    """
    Creates a MetabolicModel object from a stream
    :exception UnicodeDecodeError When stream content is not valid utf-8
    """
    stream = decompress_gzip(stream)
    format = detect_format(stream)

    stream.seek(0)
    # utf-8-sig: Skip BOM
    ss = TextIOWrapper(stream, encoding='utf-8-sig')
    content = ss.read()
    # Seeking to 0 will skip the BOM again
    ss.seek(0)

    if format == "sbml":
        sbml_handler = sbml_parser.SbmlHandler()
        sbml_parser.push_handler(sbml_handler)
        # closes ss
        sbml_parser.parser.parse(ss)
        return sbml_handler.model, content
    else:
        bioopt = OptGeneParser(ss)
        return bioopt.to_model(), content




