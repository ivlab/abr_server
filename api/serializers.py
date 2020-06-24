from rest_framework import serializers
from .models import Impression, InputValue

class ImpressionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Impression
        fields = ('name', 'version', 'visible', 'guid', 'input_values')
        read_only_fields = ('version', 'guid')

class InputValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = InputValue
        fields = ('name', 'asset_uuid', 'data_path', 'id')
        read_only_fields = ('id',)