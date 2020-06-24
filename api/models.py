import uuid
from django.db import models

class InputValue(models.Model):
    name = models.CharField(max_length=255)
    asset_uuid = models.UUIDField(null=True)
    data_path = models.CharField(max_length=255, null=True)

    def __str__(self):
        return self.name

class Impression(models.Model):
    visible = models.BooleanField()
    version = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    guid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    input_values = models.ManyToManyField(InputValue)

    def __str__(self):
        return 'Impression: {}, v{}'.format(self.name, self.version)
