from rest_framework import generics
from .serializers import ImpressionSerializer, InputValueSerializer
from .models import Impression, InputValue

class CreateViewImpression(generics.ListCreateAPIView):
    queryset = Impression.objects.all()
    serializer_class = ImpressionSerializer

    def perform_create(self, serializer):
        serializer.save()

class DetailsViewImpression(generics.RetrieveUpdateDestroyAPIView):
    queryset = Impression.objects.all()
    serializer_class = ImpressionSerializer

class CreateViewInputValue(generics.ListCreateAPIView):
    queryset = InputValue.objects.all()
    serializer_class = InputValueSerializer

    def perform_create(self, serializer):
        serializer.save()

class DetailsViewInputValue(generics.RetrieveUpdateDestroyAPIView):
    queryset = InputValue.objects.all()
    serializer_class = InputValueSerializer