# ABR Server

This is the main server component of the ABR architecture.

![The four-component ABR Architecture, including Design User Interfaces, Server,
Graphics Engines, and Data
Hosts.](https://www.sculpting-vis.org/wp-content/uploads/2021/05/abr_components.png)


## What is the server?

The server acts as an intermediary between the rest of the architecture, and
stores the *current* version of the visualization state. The visualization
state is described by a [formal json schema](./static/schemas/ABRSchema_0-2-0.json),
and is validated against the schema each time it is updated.

The server is a Python Django server. By default, it runs in debug mode which is
fine for self-contained apps, but should we want to deploy to a proper server
(e.g. https://sculptingvis.tacc.utexas.edu), nginx has been briefly tested for
such a purpose (see [abr_server_nginx.conf](./abr_server_nginx.conf) and
uwsgi_params.)


## Installation and setup

1. The abr_server depends on the abr_data_format - the custom preprocessed
geometric representation that ABR uses. Please follow the [instructions in that
repository](https://github.umn.edu/ivlab-cs/ABRUtilities/tree/master/ABRDataFormat)
for installing the `abr_data_format` Python package.
2. Install the dependencies: `python -m pip install -r requirements.txt`
3. Setup the static files: `python manage.py collectstatic`


## Run the server

The server can be run local-only (on localhost:8000 by default):

```
python manage.py runserver
```


The server can also be broadcast to other devices:

```
python manage.py runserver 0.0.0.0:8000
```