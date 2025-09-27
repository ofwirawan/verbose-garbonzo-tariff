package com.verbosegarbonzo.tariff.model;
package com.verbosegarbonzo.tariff.model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDate;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class TariffRateId implements Serializable {

    @Column(name = "hs6code", length = 6)
    private String hs6Code;

    @Column(name = "importing", length = 3)
    private String importing;

    @Column(name = "exporting", length = 3)
    private String exporting;

    @Column(name = "date")
    private LocalDate date;
}

@Entity
@Table(name = "tariff_rate")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TariffRate {

    @EmbeddedId
    private TariffRateId id;

    @MapsId("hs6Code")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hs6code", insertable = false, updatable = false)
    private Product product;

    @MapsId("importing")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importing", referencedColumnName = "iso_code", insertable = false, updatable = false)
    private Country importingCountry;

    @MapsId("exporting")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exporting", referencedColumnName = "iso_code", insertable = false, updatable = false)
    private Country exportingCountry;

    @Column(name = "expiry")
    private LocalDate expiry;

    @Column(name = "rate")
    private Double rate;
}