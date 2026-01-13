export class DirectionsResponseDto {
  constructor(route, destination) {
    this.route = {
      distance: route.distance,
      duration: route.duration,
      paths: route.paths || []
    };
    this.destination = {
      name: destination.name,
      address: destination.address,
      location: destination.location,
      phoneNumber: destination.phoneNumber
    };
  }
}
