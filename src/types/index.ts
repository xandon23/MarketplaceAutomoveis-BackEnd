export interface IUser {
  id?: string;
  name: string;
  email: string;
  password?: string;
  cpf?: string;
  phone: string;
  birthDate?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IVehicle {
  id?: string;
  brand: string;
  model: string;
  manufactureYear: number;
  modelYear: number;
  engine: string;
  transmission: string;
  location: string;
  mileage: number;
  price: number;
  description: string;
  features: string;
  status: "available" | "sold";
  userId: string;
  buyerId?: string | null;
  images?: IVehicleImage[];
  user?: Partial<IUser>;
  Buyer?: Partial<IUser>;
}

export interface IVehicleImage {
  id: string;
  vehicleId: string;
  url: string;
}

export interface IProposal {
  id?: string;
  targetVehicleId: string;
  buyerId: string;
  offeredVehicleId?: string | null;
  cashOffer: number;
  message?: string | null;
  status: "pending" | "ACCEPTED" | "rejected";
  targetVehicle?: IVehicle;
  offeredVehicle?: IVehicle;
  buyer?: Partial<IUser>;
}

export interface IReview {
  id?: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment: string;
  createdAt?: Date;
  reviewer?: Partial<IUser>;
}
