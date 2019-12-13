"""
Copyright (c) 2019 Gabriel Kind
Hochschule Mittweida, University of Applied Sciences

Released under the MIT license
"""

from metabolic_model import metabolic_model

def verify_object(obj, command):
    if "id" not in obj:
        raise ValueError("id not in command {}".format(command))

"""
Command format:
{
    "op": one of add, edit, delete
    "type": type of the SBML object modified
    "name": id of the SBML object modified
    "obj": changes applied to the object
"""

def apply_commandlist(model: metabolic_model.MetabolicModel, commandlist):
    """
    :type model: PyNetMet2.Metabolism
    """
    for command in commandlist:
        try:
            op = command["op"]
            typ = command["type"]
            idd = command["id"]
            obj = command["object"]
        except KeyError:
            raise ValueError("Bad command " + str(command))

        if "undo" in command:
            # Delete additional data
            del command["undo"]

        if typ not in ["reaction", "metabolite", "compartment", "objective"]:
            raise ValueError("Bad object type {} in command {}".format(typ, command))

        if op not in ["add", "edit", "delete"]:
            raise ValueError("Bad operation {} in command {}".format(op, command))

        if op in ["add", "edit"]:
            if "id" not in obj:
                raise ValueError("Invalid object")

        fn: metabolic_model.LstOp = getattr(model, typ)

        if op == "add":
            if fn.has(id=idd):
                raise ValueError("{} {} already in model".format(typ, idd))

            if idd != obj["id"]:
                raise ValueError("{} vs {} ID mismatch".format(idd, obj["id"]))

            instance = fn.create()

            instance.apply(obj)

            fn.add(instance)
        elif op == "edit":
            instance = fn.get(id=idd)

            if instance is None:
                raise ValueError("{} {} is not in the model".format(typ, idd))

            if instance.id != obj["id"] and fn.has(id=obj["id"]):
                raise ValueError("Rename {} {} -> {} is already in the model".format(typ, instance.id, obj["id"]))

            instance.apply(obj)
        elif op == "delete":
            if not fn.has(id=idd):
                raise ValueError("{} {} not in model".format(typ, idd))

            fn.remove(id=idd)

    return model
