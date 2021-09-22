"""
Django settings for abr_server project.

Generated by 'django-admin startproject' using Django 3.0.7.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.0/ref/settings/
"""

import os
import time
from pathlib import Path
from types import MemberDescriptorType

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'x=$0ckn%%(3&z4f8c357p^^wh2$=8v_sci$5$n=oqca^^67f*8'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']


# Application definition

INSTALLED_APPS = [
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'livereload',
    'django.contrib.staticfiles',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'livereload.middleware.LiveReloadScript',
]

ROOT_URLCONF = 'abr_server.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': ['templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'abr_server.wsgi.application'

ASGI_APPLICATION = 'abr_server.routing.application'

# Database
# https://docs.djangoproject.com/en/3.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/3.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/3.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

logdir = os.path.join(BASE_DIR, '../logs')
if not os.path.exists(logdir):
    os.mkdir(logdir)

logfile = os.path.join(logdir, 'abr_server-{}.log'.format(time.strftime('%Y-%m-%d_%H-%M-%S', time.localtime())))
print('Logging to', logfile)

# LOGGING = {
#     'version': 1,
#     'disable_existing_loggers': False,
#     'handlers': {
#         'file': {
#             'level': 'DEBUG',
#             'class': 'logging.FileHandler',
#             'filename': logfile
#         },
#     },
#     'loggers': {
#         'django': {
#             'handlers': ['file'],
#             'level': 'DEBUG',
#             'propagate': True,
#         },
#     },
# }

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.0/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, os.path.join('..', 'static'))
STATICFILES_DIRS = [os.path.join('static')]

# Serve media files in media dir (using cors_server.py)
MEDIA_ROOT = os.path.join(BASE_DIR, os.path.join('..', 'media'))
if not os.path.exists(MEDIA_ROOT):
    os.makedirs(MEDIA_ROOT)


# ABR-Specific settings
DOWNLOAD_VISASSETS = True # Download visassets from a particular state if they don't exist
VISASSET_PATH = Path(MEDIA_ROOT).joinpath('visassets')
DATASET_PATH = Path(MEDIA_ROOT).joinpath('datasets')

print('VisAssets path:', VISASSET_PATH)
print('Dataset path:', DATASET_PATH)

if not DATASET_PATH.exists():
    DATASET_PATH.mkdir()
if not VISASSET_PATH.exists():
    VISASSET_PATH.mkdir()

VISASSET_JSON = 'artifact.json'
VISASSET_LIBRARY = 'http://sculptingvis.tacc.utexas.edu/static/Artifacts/'

WS_SEND_SCHEMA = 'https://raw.githubusercontent.com/ivlab/abr-schema/master/abr-server-websocket-send.json'

# Issue for windows loading .js files
if DEBUG:
    import mimetypes
    mimetypes.add_type("application/javascript", ".js",True)
