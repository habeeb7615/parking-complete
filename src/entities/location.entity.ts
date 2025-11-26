import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Contractor } from './contractor.entity';
import { Attendant } from './attendant.entity';
import { Vehicle } from './vehicle.entity';

@Entity('parking_locations')
export class Location {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column()
  locations_name: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  pincode: string;

  @Column('varchar', { length: 36 })
  contractor_id: string;

  @Column('int', { nullable: true })
  total_slots: number;

  @Column('int', { nullable: true })
  occupied_slots: number;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  created_by: string;

  @Column({ nullable: true })
  updated_by: string;

  @Column({ nullable: true })
  deleted_by: string;

  @Column({ type: 'timestamp', nullable: true })
  deleted_on: Date;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn({ name: 'created_on' })
  created_on: Date;

  @UpdateDateColumn({ name: 'updated_on' })
  updated_on: Date;

  @ManyToOne(() => Contractor, (contractor) => contractor.parking_locations)
  @JoinColumn({ name: 'contractor_id' })
  contractors: Contractor;

  @OneToMany(() => Attendant, (attendant) => attendant.parking_locations)
  attendants: Attendant[];

  @OneToMany(() => Vehicle, (vehicle) => vehicle.parking_locations)
  vehicles: Vehicle[];
}

